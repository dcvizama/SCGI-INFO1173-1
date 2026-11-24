import { act, renderHook } from '@testing-library/react-native';
import { IncidentProvider, useIncident } from '../IncidentContext';
import {
  listarHistorialIncidencia,
  listarIncidencias,
  obtenerIncidencia,
} from '../../services/incidentService';
import {
  historialTicket,
  ticketAsignado,
  ticketClasificado,
  ticketPendiente,
} from '../../state/__fixtures__/tickets';

jest.mock('../mockIncidentService', () => ({ crearIncidencia: jest.fn() }));
jest.mock('../../services/incidentService', () => ({
  listarIncidencias: jest.fn(),
  obtenerIncidencia: jest.fn(),
  listarHistorialIncidencia: jest.fn(),
}));

const ID = ticketPendiente.id_incidencia;
const SIN_CONEXION = { mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' };

const wrapper = ({ children }) => <IncidentProvider>{children}</IncidentProvider>;

async function montar() {
  const { result } = await renderHook(() => useIncident(), { wrapper });
  return result;
}

// Promesa que se resuelve a mano, para ver el estado mientras la petición sigue en curso.
function pendiente() {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('IncidentContext: bandeja de tickets (RF5)', () => {
  it('parte vacía', async () => {
    const result = await montar();

    expect(result.current.tickets).toEqual([]);
    expect(result.current.estadoTickets).toBe('inactivo');
    expect(result.current.errorTickets).toBeNull();
  });

  it('carga la bandeja con los filtros pedidos', async () => {
    listarIncidencias.mockResolvedValue([ticketPendiente]);
    const result = await montar();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.loadTickets({ id_estado: 1 });
    });

    expect(listarIncidencias).toHaveBeenCalledWith({ id_estado: 1 });
    expect(respuesta).toEqual([ticketPendiente]);
    expect(result.current.tickets).toEqual([ticketPendiente]);
    expect(result.current.filtrosTickets).toEqual({ id_estado: 1 });
    expect(result.current.estadoTickets).toBe('listo');
  });

  it('marca la carga mientras espera la respuesta', async () => {
    const respuesta = pendiente();
    listarIncidencias.mockReturnValue(respuesta.promesa);
    const result = await montar();

    let carga;
    await act(async () => {
      carga = result.current.loadTickets();
    });

    expect(result.current.cargandoTickets).toBe(true);

    await act(async () => {
      respuesta.resolver([ticketPendiente]);
      await carga;
    });

    expect(result.current.cargandoTickets).toBe(false);
  });

  it('sin conexión guarda el mensaje de la API y devuelve null', async () => {
    listarIncidencias.mockRejectedValue(SIN_CONEXION);
    const result = await montar();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.loadTickets();
    });

    expect(respuesta).toBeNull();
    expect(result.current.estadoTickets).toBe('error');
    expect(result.current.errorTickets).toEqual(SIN_CONEXION);
  });

  it('un error inesperado recibe un mensaje genérico', async () => {
    listarIncidencias.mockRejectedValue(new TypeError('boom'));
    const result = await montar();

    await act(async () => {
      await result.current.loadTickets();
    });

    expect(result.current.errorTickets).toEqual({
      mensaje: 'No pudimos cargar las incidencias. Intenta de nuevo.',
      tipo: 'desconocido',
    });
  });

  it('refreshTickets repite los últimos filtros', async () => {
    listarIncidencias.mockResolvedValue([ticketAsignado]);
    const result = await montar();

    await act(async () => {
      await result.current.loadTickets({ id_estado: 3 });
    });
    await act(async () => {
      await result.current.refreshTickets();
    });

    expect(listarIncidencias).toHaveBeenCalledTimes(2);
    expect(listarIncidencias).toHaveBeenLastCalledWith({ id_estado: 3 });
  });

  it('si se cambia el filtro antes de que responda, gana la última petición', async () => {
    const primera = pendiente();
    const segunda = pendiente();
    listarIncidencias.mockReturnValueOnce(primera.promesa).mockReturnValueOnce(segunda.promesa);
    const result = await montar();

    let cargaVieja;
    let cargaNueva;
    await act(async () => {
      cargaVieja = result.current.loadTickets({ id_estado: 1 });
      cargaNueva = result.current.loadTickets({ id_estado: 3 });
    });
    await act(async () => {
      segunda.resolver([ticketAsignado]);
      await cargaNueva;
    });
    await act(async () => {
      primera.resolver([ticketPendiente]);
      await cargaVieja;
    });

    expect(result.current.tickets).toEqual([ticketAsignado]);
    expect(result.current.filtrosTickets).toEqual({ id_estado: 3 });
  });
});

describe('IncidentContext: seguimiento y trazabilidad (RF6)', () => {
  it('abre una incidencia con su detalle y su historial', async () => {
    obtenerIncidencia.mockResolvedValue(ticketClasificado);
    listarHistorialIncidencia.mockResolvedValue(historialTicket);
    const result = await montar();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.openTicket(ID);
    });

    expect(obtenerIncidencia).toHaveBeenCalledWith(ID);
    expect(listarHistorialIncidencia).toHaveBeenCalledWith(ID);
    expect(respuesta).toEqual({ incidencia: ticketClasificado, historial: historialTicket });
    expect(result.current.ticketActual).toEqual(ticketClasificado);
    expect(result.current.historialTicket).toEqual(historialTicket);
    expect(result.current.estadoTicket).toBe('listo');
  });

  it('desde la bandeja muestra la fila mientras carga el detalle', async () => {
    const detalle = pendiente();
    obtenerIncidencia.mockReturnValue(detalle.promesa);
    listarHistorialIncidencia.mockResolvedValue(historialTicket);
    const result = await montar();

    let apertura;
    await act(async () => {
      apertura = result.current.openTicket(ticketPendiente);
    });

    expect(result.current.ticketActual).toEqual(ticketPendiente);
    expect(result.current.cargandoTicket).toBe(true);

    await act(async () => {
      detalle.resolver(ticketClasificado);
      await apertura;
    });

    expect(result.current.ticketActual).toEqual(ticketClasificado);
  });

  it('si falla el detalle o el historial, guarda el error', async () => {
    obtenerIncidencia.mockResolvedValue(ticketPendiente);
    listarHistorialIncidencia.mockRejectedValue(SIN_CONEXION);
    const result = await montar();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.openTicket(ID);
    });

    expect(respuesta).toBeNull();
    expect(result.current.estadoTicket).toBe('error');
    expect(result.current.errorTicket).toEqual(SIN_CONEXION);
  });

  it('refreshTicket recarga la incidencia abierta', async () => {
    obtenerIncidencia
      .mockResolvedValueOnce(ticketClasificado)
      .mockResolvedValueOnce(ticketAsignado);
    listarHistorialIncidencia.mockResolvedValue(historialTicket);
    const result = await montar();

    await act(async () => {
      await result.current.openTicket(ID);
    });
    await act(async () => {
      await result.current.refreshTicket();
    });

    expect(obtenerIncidencia).toHaveBeenCalledTimes(2);
    expect(result.current.ticketActual).toEqual(ticketAsignado);
  });

  it('refreshTicket sin incidencia abierta no llama a la API', async () => {
    const result = await montar();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.refreshTicket();
    });

    expect(respuesta).toBeNull();
    expect(obtenerIncidencia).not.toHaveBeenCalled();
  });

  it('closeTicket limpia el seguimiento', async () => {
    obtenerIncidencia.mockResolvedValue(ticketPendiente);
    listarHistorialIncidencia.mockResolvedValue(historialTicket);
    const result = await montar();

    await act(async () => {
      await result.current.openTicket(ID);
    });
    await act(async () => {
      result.current.closeTicket();
    });

    expect(result.current.ticketActual).toBeNull();
    expect(result.current.historialTicket).toEqual([]);
    expect(result.current.estadoTicket).toBe('inactivo');
  });

  it('cancelar un reporte no vacía la bandeja', async () => {
    listarIncidencias.mockResolvedValue([ticketPendiente]);
    const result = await montar();

    await act(async () => {
      await result.current.loadTickets();
    });
    await act(async () => {
      result.current.cancelIncident();
    });

    expect(result.current.tickets).toEqual([ticketPendiente]);
  });
});
