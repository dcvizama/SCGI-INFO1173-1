import { act, renderHook } from '@testing-library/react-native';
import { IncidentProvider, useIncident } from '../IncidentContext';
import {
  asignarIncidencia,
  cambiarEstadoIncidencia,
  clasificarIncidencia,
  listarHistorialIncidencia,
  listarIncidencias,
  obtenerIncidencia,
} from '../../services/incidentService';
import {
  ESTADO,
  tecnico,
  ticketPendiente,
  transicionesContrato,
} from '../../state/__fixtures__/tickets';

// Pruebas de transición de estados de la incidencia (SCRUM-123, RF5, RF6).
// En vez de respuestas fijas, los servicios hablan con un backend en memoria
// que aplica la matriz de transiciones del contrato v1.3.0: estado de origen,
// rol permitido y comentario obligatorio. Así se recorre el ciclo de vida
// completo a través del contexto, igual que lo haría la app.

jest.mock('../mockIncidentService', () => ({ crearIncidencia: jest.fn() }));
jest.mock('../../services/incidentService', () => ({
  listarIncidencias: jest.fn(),
  obtenerIncidencia: jest.fn(),
  listarHistorialIncidencia: jest.fn(),
  clasificarIncidencia: jest.fn(),
  asignarIncidencia: jest.fn(),
  cambiarEstadoIncidencia: jest.fn(),
  listarTecnicos: jest.fn(),
}));

const ESTADOS_POR_ID = Object.fromEntries(Object.values(ESTADO).map((e) => [e.id_estado, e]));
const { PENDIENTE, CLASIFICADA, ASIGNADA, EN_DIAGNOSTICO, EN_REPARACION, RESUELTA } = ESTADO;
const { VERIFICADA, CERRADA } = ESTADO;

// ---------------------------------------------------------------------------
// Backend en memoria
// ---------------------------------------------------------------------------

const backend = {
  incidencia: null,
  historial: [],
  rol: 'SUPERVISOR', // rol del usuario del token
};

function rechazo(status, mensaje) {
  return Promise.reject({ status, tipo: 'http', mensaje });
}

function reiniciarBackend(estadoInicial = PENDIENTE) {
  backend.incidencia = { ...ticketPendiente, estado: estadoInicial };
  backend.historial = [
    {
      id_historial: 'h-0',
      id_incidencia: ticketPendiente.id_incidencia,
      estado_anterior: null,
      estado: estadoInicial,
      comentario: null,
    },
  ];
  backend.rol = 'SUPERVISOR';
}

// Aplica un cambio de estado como lo haría el backend: valida la matriz.
function mover(idDestino, comentario, cambios = {}) {
  const origen = backend.incidencia.estado;
  const regla = transicionesContrato.find(
    (t) => t.id_estado_origen === origen.id_estado && t.id_estado_destino === idDestino
  );

  if (!regla) {
    const destino = ESTADOS_POR_ID[idDestino]?.nombre_estado ?? idDestino;
    return rechazo(409, `La incidencia no puede pasar de ${origen.nombre_estado} a ${destino}.`);
  }
  if (!regla.roles_permitidos.includes(backend.rol)) {
    return rechazo(403, 'No tienes permiso para hacer este cambio.');
  }
  if (regla.requiere_comentario && !comentario?.trim()) {
    return rechazo(400, 'Este cambio de estado exige un comentario.');
  }

  const estado = ESTADOS_POR_ID[idDestino];
  backend.incidencia = { ...backend.incidencia, ...cambios, estado };
  backend.historial = [
    ...backend.historial,
    {
      id_historial: `h-${backend.historial.length}`,
      id_incidencia: backend.incidencia.id_incidencia,
      estado_anterior: origen,
      estado,
      comentario: comentario ?? null,
    },
  ];

  return Promise.resolve(backend.incidencia);
}

function conectarBackend() {
  listarIncidencias.mockImplementation(async () => [backend.incidencia]);
  obtenerIncidencia.mockImplementation(async () => backend.incidencia);
  listarHistorialIncidencia.mockImplementation(async () => backend.historial);
  clasificarIncidencia.mockImplementation((id, { prioridad, comentario }) =>
    mover(CLASIFICADA.id_estado, comentario, { prioridad })
  );
  asignarIncidencia.mockImplementation(async (id, idTecnico) => {
    const incidencia = await mover(ASIGNADA.id_estado, null, { id_tecnico_asignado: idTecnico });
    return {
      orden: { id_incidencia: id, id_tecnico: idTecnico },
      incidencia,
      errorActualizacion: null,
    };
  });
  cambiarEstadoIncidencia.mockImplementation((id, { id_estado, comentario }) =>
    mover(id_estado, comentario)
  );
}

// ---------------------------------------------------------------------------
// Ayudantes
// ---------------------------------------------------------------------------

const wrapper = ({ children }) => <IncidentProvider>{children}</IncidentProvider>;

async function abrirTicket() {
  const { result } = await renderHook(() => useIncident(), { wrapper });

  await act(async () => {
    await result.current.openTicket(backend.incidencia.id_incidencia);
  });

  return result;
}

// Lleva la incidencia al estado destino con la acción que corresponde.
async function pasarA(result, destino, { rol, comentario } = {}) {
  if (rol) backend.rol = rol;

  let respuesta;
  await act(async () => {
    if (destino === CLASIFICADA) {
      respuesta = await result.current.classifyIncident({ prioridad: 'media', comentario });
    } else if (destino === ASIGNADA) {
      respuesta = await result.current.assignIncident(tecnico.id_usuario);
    } else {
      respuesta = await result.current.updateIncidentStatus(destino.id_estado, comentario);
    }
  });

  return respuesta;
}

function estadosDelHistorial(result) {
  return result.current.historialTicket.map((h) => h.estado.nombre_estado);
}

beforeEach(() => {
  jest.clearAllMocks();
  reiniciarBackend();
  conectarBackend();
});

// ---------------------------------------------------------------------------
// Pruebas
// ---------------------------------------------------------------------------

describe('Transiciones: ciclo de vida completo', () => {
  it('recorre de Pendiente de revisión a Cerrada con los roles del contrato', async () => {
    const result = await abrirTicket();

    await pasarA(result, CLASIFICADA, { rol: 'SUPERVISOR' });
    await pasarA(result, ASIGNADA, { rol: 'SUPERVISOR' });
    await pasarA(result, EN_DIAGNOSTICO, { rol: 'TECNICO', comentario: 'Reviso la fuente' });
    await pasarA(result, EN_REPARACION, { rol: 'TECNICO', comentario: 'Cambio de fuente' });
    await pasarA(result, RESUELTA, { rol: 'TECNICO', comentario: 'Fuente reemplazada' });
    await pasarA(result, VERIFICADA, { rol: 'SUPERVISOR', comentario: 'Probado en sala' });
    await pasarA(result, CERRADA, { rol: 'SUPERVISOR', comentario: 'Cierre' });

    expect(result.current.ticketActual.estado).toEqual(CERRADA);
    expect(result.current.ticketActual.id_tecnico_asignado).toBe(tecnico.id_usuario);
    expect(result.current.errorAccion).toBeNull();
    expect(estadosDelHistorial(result)).toEqual([
      'Pendiente de revision',
      'Clasificada',
      'Asignada',
      'En diagnostico',
      'En reparacion',
      'Resuelta',
      'Verificada',
      'Cerrada',
    ]);
  });

  it('cada registro del historial enlaza el estado anterior con el nuevo', async () => {
    const result = await abrirTicket();

    await pasarA(result, CLASIFICADA);
    await pasarA(result, ASIGNADA);

    const [, clasificacion, asignacion] = result.current.historialTicket;
    expect(clasificacion.estado_anterior).toEqual(PENDIENTE);
    expect(clasificacion.estado).toEqual(CLASIFICADA);
    expect(asignacion.estado_anterior).toEqual(CLASIFICADA);
    expect(asignacion.estado).toEqual(ASIGNADA);
  });

  it('el supervisor puede rechazar la solución y devolverla a reparación', async () => {
    reiniciarBackend(RESUELTA);
    const result = await abrirTicket();

    await pasarA(result, EN_REPARACION, { rol: 'SUPERVISOR', comentario: 'Sigue fallando' });
    expect(result.current.ticketActual.estado).toEqual(EN_REPARACION);

    await pasarA(result, RESUELTA, { rol: 'TECNICO', comentario: 'Segunda revisión' });
    expect(result.current.ticketActual.estado).toEqual(RESUELTA);
    expect(estadosDelHistorial(result)).toEqual(['Resuelta', 'En reparacion', 'Resuelta']);
  });

  it('el supervisor puede descartar un reporte pendiente y cerrarlo', async () => {
    const result = await abrirTicket();

    await pasarA(result, CERRADA, { rol: 'SUPERVISOR', comentario: 'Reporte duplicado' });

    expect(result.current.ticketActual.estado).toEqual(CERRADA);
    expect(result.current.historialTicket.at(-1).comentario).toBe('Reporte duplicado');
  });
});

describe('Transiciones: cada regla de la matriz', () => {
  const casos = transicionesContrato.map((t) => [
    ESTADOS_POR_ID[t.id_estado_origen].nombre_estado,
    ESTADOS_POR_ID[t.id_estado_destino].nombre_estado,
    t,
  ]);

  it.each(casos)('%s -> %s se aplica con el rol permitido', async (origen, destino, regla) => {
    reiniciarBackend(ESTADOS_POR_ID[regla.id_estado_origen]);
    const result = await abrirTicket();

    const respuesta = await pasarA(result, ESTADOS_POR_ID[regla.id_estado_destino], {
      rol: regla.roles_permitidos[0],
      comentario: 'Comentario del cambio',
    });

    expect(respuesta.estado.id_estado).toBe(regla.id_estado_destino);
    expect(result.current.ticketActual.estado.id_estado).toBe(regla.id_estado_destino);
    expect(result.current.historialTicket.at(-1).estado_anterior.id_estado).toBe(
      regla.id_estado_origen
    );
    expect(result.current.estadoAccion).toBe('exito');
  });
});

describe('Transiciones rechazadas', () => {
  const saltos = [
    [PENDIENTE, ASIGNADA],
    [CLASIFICADA, EN_DIAGNOSTICO],
    [ASIGNADA, RESUELTA],
    [EN_DIAGNOSTICO, CERRADA],
    [VERIFICADA, EN_REPARACION],
  ];

  it.each(saltos.map(([o, d]) => [o.nombre_estado, d.nombre_estado, o, d]))(
    'no permite saltar de %s a %s',
    async (nombreOrigen, nombreDestino, origen, destino) => {
      reiniciarBackend(origen);
      const result = await abrirTicket();

      const respuesta = await pasarA(result, destino, { comentario: 'Intento' });

      expect(respuesta).toBeNull();
      expect(result.current.estadoAccion).toBe('error');
      expect(result.current.errorAccion.mensaje).toBe(
        `La incidencia no puede pasar de ${nombreOrigen} a ${nombreDestino}.`
      );
      expect(result.current.ticketActual.estado).toEqual(origen);
      expect(result.current.historialTicket).toHaveLength(1);
    }
  );

  it('el técnico no puede verificar una incidencia resuelta', async () => {
    reiniciarBackend(RESUELTA);
    const result = await abrirTicket();

    await pasarA(result, VERIFICADA, { rol: 'TECNICO' });

    expect(result.current.errorAccion.mensaje).toBe('No tienes permiso para hacer este cambio.');
    expect(result.current.ticketActual.estado).toEqual(RESUELTA);
  });

  it('el supervisor no puede pasar a diagnóstico una incidencia asignada', async () => {
    reiniciarBackend(ASIGNADA);
    const result = await abrirTicket();

    await pasarA(result, EN_DIAGNOSTICO, { rol: 'SUPERVISOR', comentario: 'Lo reviso yo' });

    expect(result.current.errorAccion.mensaje).toBe('No tienes permiso para hacer este cambio.');
    expect(result.current.ticketActual.estado).toEqual(ASIGNADA);
  });

  it('marcar como resuelta exige comentario', async () => {
    reiniciarBackend(EN_REPARACION);
    const result = await abrirTicket();

    await pasarA(result, RESUELTA, { rol: 'TECNICO', comentario: '  ' });

    expect(result.current.errorAccion.mensaje).toBe('Este cambio de estado exige un comentario.');
    expect(result.current.ticketActual.estado).toEqual(EN_REPARACION);
  });

  it('después de un rechazo se puede reintentar con los datos correctos', async () => {
    reiniciarBackend(EN_REPARACION);
    const result = await abrirTicket();

    await pasarA(result, RESUELTA, { rol: 'TECNICO' });
    expect(result.current.estadoAccion).toBe('error');

    await pasarA(result, RESUELTA, { rol: 'TECNICO', comentario: 'Fuente reemplazada' });
    expect(result.current.estadoAccion).toBe('exito');
    expect(result.current.errorAccion).toBeNull();
    expect(result.current.ticketActual.estado).toEqual(RESUELTA);
  });

  it('una incidencia cerrada no admite más cambios y ni siquiera llama a la API', async () => {
    reiniciarBackend(CERRADA);
    const result = await abrirTicket();

    const respuesta = await pasarA(result, EN_REPARACION, { comentario: 'Reabrir' });

    expect(respuesta).toBeNull();
    expect(cambiarEstadoIncidencia).not.toHaveBeenCalled();
    expect(result.current.errorAccion).toEqual({
      mensaje: 'La incidencia ya está cerrada y no admite cambios.',
      tipo: 'datos',
    });
  });
});
