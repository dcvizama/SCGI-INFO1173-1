import { act, renderHook } from '@testing-library/react-native';
import { IncidentProvider, useIncident } from '../IncidentContext';
import {
  asignarIncidencia,
  cambiarEstadoIncidencia,
  clasificarIncidencia,
  listarHistorialIncidencia,
  listarIncidencias,
  listarTecnicos,
  obtenerIncidencia,
} from '../../services/incidentService';
import {
  historialAsignado,
  historialTicket,
  ordenTrabajo,
  otroTicket,
  tecnico,
  ticketAsignado,
  ticketClasificado,
  ticketEnDiagnostico,
  ticketPendiente,
} from '../../state/__fixtures__/tickets';

jest.mock('../../services/incidentService', () => ({
  listarIncidencias: jest.fn(),
  obtenerIncidencia: jest.fn(),
  listarHistorialIncidencia: jest.fn(),
  clasificarIncidencia: jest.fn(),
  asignarIncidencia: jest.fn(),
  cambiarEstadoIncidencia: jest.fn(),
  listarTecnicos: jest.fn(),
}));

const ID = ticketPendiente.id_incidencia;
const SIN_CONEXION = { mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' };
const YA_CLASIFICADA = {
  mensaje: 'Solo se clasifican incidencias pendientes de revision.',
  tipo: 'http',
  status: 409,
};

const wrapper = ({ children }) => <IncidentProvider>{children}</IncidentProvider>;

// Monta el contexto con la bandeja cargada y una incidencia abierta. Los mocks de
// cada prueba se configuran después, porque este paso usa los suyos.
async function montarConTicket(incidencia = ticketPendiente, filtros = { id_estado: 1 }) {
  listarIncidencias.mockResolvedValue([incidencia, otroTicket]);
  obtenerIncidencia.mockResolvedValue(incidencia);
  listarHistorialIncidencia.mockResolvedValue(historialTicket);

  const { result } = await renderHook(() => useIncident(), { wrapper });

  await act(async () => {
    await result.current.loadTickets(filtros);
  });
  await act(async () => {
    await result.current.openTicket(incidencia);
  });

  jest.clearAllMocks();
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('IncidentContext: clasificar (RF5)', () => {
  it('envía la clasificación de la incidencia abierta y la actualiza', async () => {
    const result = await montarConTicket();
    clasificarIncidencia.mockResolvedValue(ticketClasificado);
    listarHistorialIncidencia.mockResolvedValue(historialTicket);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.classifyIncident({
        prioridad: 'media',
        comentario: 'Hay sala de respaldo',
      });
    });

    expect(clasificarIncidencia).toHaveBeenCalledWith(ID, {
      prioridad: 'media',
      comentario: 'Hay sala de respaldo',
    });
    expect(respuesta).toEqual(ticketClasificado);
    expect(result.current.ticketActual).toEqual(ticketClasificado);
    expect(result.current.estadoAccion).toBe('exito');
  });

  it('la incidencia clasificada sale de la bandeja de pendientes', async () => {
    const result = await montarConTicket();
    clasificarIncidencia.mockResolvedValue(ticketClasificado);
    listarHistorialIncidencia.mockResolvedValue(historialTicket);

    await act(async () => {
      await result.current.classifyIncident({ prioridad: 'media' });
    });

    expect(result.current.tickets).toEqual([otroTicket]);
  });

  it('un rechazo de la API deja el motivo y no cambia la incidencia', async () => {
    const result = await montarConTicket();
    clasificarIncidencia.mockRejectedValue(YA_CLASIFICADA);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.classifyIncident({ prioridad: 'media' });
    });

    expect(respuesta).toBeNull();
    expect(result.current.estadoAccion).toBe('error');
    expect(result.current.errorAccion).toEqual({
      mensaje: YA_CLASIFICADA.mensaje,
      tipo: 'http',
    });
    expect(result.current.ticketActual).toEqual(ticketPendiente);
    expect(result.current.tickets).toEqual([ticketPendiente, otroTicket]);
  });

  it('sin incidencia abierta no llama a la API', async () => {
    const { result } = await renderHook(() => useIncident(), { wrapper });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.classifyIncident({ prioridad: 'media' });
    });

    expect(respuesta).toBeNull();
    expect(clasificarIncidencia).not.toHaveBeenCalled();
  });
});

describe('IncidentContext: asignar (RF5)', () => {
  it('asigna el técnico, actualiza la incidencia y recarga el historial', async () => {
    const result = await montarConTicket(ticketClasificado, {});
    asignarIncidencia.mockResolvedValue({
      orden: ordenTrabajo,
      incidencia: ticketAsignado,
      errorActualizacion: null,
    });
    listarHistorialIncidencia.mockResolvedValue(historialAsignado);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.assignIncident(tecnico.id_usuario);
    });

    expect(asignarIncidencia).toHaveBeenCalledWith(ID, tecnico.id_usuario);
    expect(respuesta).toEqual(ticketAsignado);
    expect(result.current.ticketActual).toEqual(ticketAsignado);
    expect(result.current.historialTicket).toEqual(historialAsignado);
    expect(result.current.tickets).toEqual([ticketAsignado, otroTicket]);
  });

  it('si la asignación se hizo pero no se pudo leer, recarga la incidencia sin repetirla', async () => {
    const result = await montarConTicket(ticketClasificado, {});
    asignarIncidencia.mockResolvedValue({
      orden: ordenTrabajo,
      incidencia: null,
      errorActualizacion: SIN_CONEXION,
    });
    obtenerIncidencia.mockResolvedValue(ticketAsignado);
    listarHistorialIncidencia.mockResolvedValue(historialAsignado);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.assignIncident(tecnico.id_usuario);
    });

    expect(asignarIncidencia).toHaveBeenCalledTimes(1);
    expect(obtenerIncidencia).toHaveBeenCalledWith(ID);
    expect(respuesta).toEqual(ticketAsignado);
    expect(result.current.ticketActual).toEqual(ticketAsignado);
    expect(result.current.estadoAccion).toBe('exito');
  });

  it('si no se puede recargar el historial, la asignación igual queda hecha', async () => {
    const result = await montarConTicket(ticketClasificado, {});
    asignarIncidencia.mockResolvedValue({
      orden: ordenTrabajo,
      incidencia: ticketAsignado,
      errorActualizacion: null,
    });
    listarHistorialIncidencia.mockRejectedValue(SIN_CONEXION);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.assignIncident(tecnico.id_usuario);
    });

    expect(respuesta).toEqual(ticketAsignado);
    expect(result.current.estadoAccion).toBe('exito');
    expect(result.current.historialTicket).toEqual(historialTicket);
  });

  it('ignora un segundo toque mientras la asignación sigue en curso', async () => {
    const result = await montarConTicket(ticketClasificado, {});
    let terminar;
    asignarIncidencia.mockImplementation(
      () =>
        new Promise((resolve) => {
          terminar = () =>
            resolve({ orden: ordenTrabajo, incidencia: ticketAsignado, errorActualizacion: null });
        })
    );
    listarHistorialIncidencia.mockResolvedValue(historialAsignado);

    let primera;
    let segunda;
    await act(async () => {
      primera = result.current.assignIncident(tecnico.id_usuario);
      segunda = result.current.assignIncident(tecnico.id_usuario);
    });

    expect(result.current.procesandoAccion).toBe(true);

    await act(async () => {
      terminar();
      await primera;
    });

    expect(await segunda).toBeNull();
    expect(asignarIncidencia).toHaveBeenCalledTimes(1);
    expect(result.current.procesandoAccion).toBe(false);
  });

  it('sin conexión guarda el mensaje de la API', async () => {
    const result = await montarConTicket(ticketClasificado, {});
    asignarIncidencia.mockRejectedValue(SIN_CONEXION);

    await act(async () => {
      await result.current.assignIncident(tecnico.id_usuario);
    });

    expect(result.current.errorAccion).toEqual(SIN_CONEXION);
    expect(result.current.ticketActual).toEqual(ticketClasificado);
  });
});

describe('IncidentContext: cambiar de estado (RF6)', () => {
  const EN_DIAGNOSTICO = ticketEnDiagnostico.estado.id_estado;

  it('mueve la incidencia abierta al nuevo estado con su comentario', async () => {
    const result = await montarConTicket(ticketAsignado, {});
    cambiarEstadoIncidencia.mockResolvedValue(ticketEnDiagnostico);
    listarHistorialIncidencia.mockResolvedValue(historialAsignado);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.updateIncidentStatus(
        EN_DIAGNOSTICO,
        'Se revisa la fuente de poder.'
      );
    });

    expect(cambiarEstadoIncidencia).toHaveBeenCalledWith(ID, {
      id_estado: EN_DIAGNOSTICO,
      comentario: 'Se revisa la fuente de poder.',
    });
    expect(respuesta).toEqual(ticketEnDiagnostico);
    expect(result.current.ticketActual).toEqual(ticketEnDiagnostico);
    expect(result.current.historialTicket).toEqual(historialAsignado);
    expect(result.current.estadoAccion).toBe('exito');
  });

  it('en la bandeja de asignadas, la incidencia que avanza sale de la lista', async () => {
    const result = await montarConTicket(ticketAsignado, {
      id_estado: ticketAsignado.estado.id_estado,
    });
    cambiarEstadoIncidencia.mockResolvedValue(ticketEnDiagnostico);
    listarHistorialIncidencia.mockResolvedValue(historialAsignado);

    await act(async () => {
      await result.current.updateIncidentStatus(EN_DIAGNOSTICO, 'Revisión en terreno');
    });

    expect(result.current.tickets).toEqual([otroTicket]);
  });

  it('si el servicio rechaza los datos (sin comentario), muestra su mensaje', async () => {
    const result = await montarConTicket(ticketAsignado, {});
    cambiarEstadoIncidencia.mockRejectedValue({
      mensaje: 'Escribe un comentario que explique el cambio de estado.',
      tipo: 'datos',
    });

    await act(async () => {
      await result.current.updateIncidentStatus(EN_DIAGNOSTICO, '   ');
    });

    expect(result.current.estadoAccion).toBe('error');
    expect(result.current.errorAccion).toEqual({
      mensaje: 'Escribe un comentario que explique el cambio de estado.',
      tipo: 'datos',
    });
    expect(result.current.ticketActual).toEqual(ticketAsignado);
  });

  it('una transición no permitida (409) deja el motivo y la incidencia como estaba', async () => {
    const result = await montarConTicket(ticketAsignado, {});
    cambiarEstadoIncidencia.mockRejectedValue({
      mensaje: 'La incidencia no puede pasar de Asignada a Cerrada.',
      tipo: 'http',
      status: 409,
    });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.updateIncidentStatus(8, 'Se cierra');
    });

    expect(respuesta).toBeNull();
    expect(result.current.errorAccion.mensaje).toBe(
      'La incidencia no puede pasar de Asignada a Cerrada.'
    );
    expect(result.current.ticketActual).toEqual(ticketAsignado);
    expect(listarHistorialIncidencia).not.toHaveBeenCalled();
  });

  it('un error inesperado recibe un mensaje genérico', async () => {
    const result = await montarConTicket(ticketAsignado, {});
    cambiarEstadoIncidencia.mockRejectedValue(new TypeError('boom'));

    await act(async () => {
      await result.current.updateIncidentStatus(EN_DIAGNOSTICO, 'Revisión');
    });

    expect(result.current.errorAccion).toEqual({
      mensaje: 'No pudimos cambiar el estado de la incidencia. Intenta de nuevo.',
      tipo: 'desconocido',
    });
  });

  it('sin incidencia abierta no llama a la API', async () => {
    const { result } = await renderHook(() => useIncident(), { wrapper });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.updateIncidentStatus(EN_DIAGNOSTICO, 'Revisión');
    });

    expect(respuesta).toBeNull();
    expect(cambiarEstadoIncidencia).not.toHaveBeenCalled();
  });
});

describe('IncidentContext: técnicos para asignar (RF5)', () => {
  it('carga la lista de técnicos', async () => {
    listarTecnicos.mockResolvedValue([tecnico]);
    const { result } = await renderHook(() => useIncident(), { wrapper });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.loadTechnicians();
    });

    expect(respuesta).toEqual([tecnico]);
    expect(result.current.tecnicos).toEqual([tecnico]);
    expect(result.current.estadoTecnicos).toBe('listo');
  });

  it('un error inesperado recibe un mensaje genérico', async () => {
    listarTecnicos.mockRejectedValue(new TypeError('boom'));
    const { result } = await renderHook(() => useIncident(), { wrapper });

    await act(async () => {
      await result.current.loadTechnicians();
    });

    expect(result.current.estadoTecnicos).toBe('error');
    expect(result.current.errorTecnicos).toEqual({
      mensaje: 'No pudimos cargar los técnicos. Intenta de nuevo.',
      tipo: 'desconocido',
    });
  });
});
