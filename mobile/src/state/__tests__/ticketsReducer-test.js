import {
  ACCIONES_TICKETS,
  ESTADOS_CARGA,
  estadoInicialTickets,
  ticketsReducer,
} from '../ticketsReducer';
import {
  historialTicket,
  otroTicket,
  ticketAsignado,
  ticketClasificado,
  ticketPendiente,
} from '../__fixtures__/tickets';

const ID = ticketPendiente.id_incidencia;
const OTRA = otroTicket;
const ERROR = { mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' };

function aplicar(...acciones) {
  return acciones.reduce(ticketsReducer, estadoInicialTickets);
}

const cargando = (solicitud, filtros = {}) => ({
  type: ACCIONES_TICKETS.BANDEJA_CARGANDO,
  filtros,
  solicitud,
});
const cargada = (solicitud, tickets) => ({
  type: ACCIONES_TICKETS.BANDEJA_CARGADA,
  tickets,
  solicitud,
});
const abrir = (idIncidencia, incidencia) => ({
  type: ACCIONES_TICKETS.SEGUIMIENTO_ABIERTO,
  idIncidencia,
  incidencia,
});
const cargado = (incidencia, historial) => ({
  type: ACCIONES_TICKETS.SEGUIMIENTO_CARGADO,
  incidencia,
  historial,
});

describe('ticketsReducer: bandeja', () => {
  it('parte vacía e inactiva', () => {
    expect(estadoInicialTickets.bandeja).toMatchObject({
      tickets: [],
      estado: ESTADOS_CARGA.INACTIVO,
      error: null,
    });
  });

  it('guarda los filtros al cargar y los tickets al responder', () => {
    const filtros = { id_estado: 1 };
    const estado = aplicar(cargando(1, filtros), cargada(1, [ticketPendiente]));

    expect(estado.bandeja).toMatchObject({
      tickets: [ticketPendiente],
      filtros,
      estado: ESTADOS_CARGA.LISTO,
    });
  });

  it('mientras recarga sigue mostrando los tickets anteriores', () => {
    const estado = aplicar(cargando(1), cargada(1, [ticketPendiente]), cargando(2));

    expect(estado.bandeja.estado).toBe(ESTADOS_CARGA.CARGANDO);
    expect(estado.bandeja.tickets).toEqual([ticketPendiente]);
  });

  it('solo aplica la respuesta de la última petición', () => {
    const estado = aplicar(
      cargando(1, { id_estado: 1 }),
      cargando(2, { id_estado: 3 }),
      cargada(2, [ticketAsignado]),
      cargada(1, [ticketPendiente])
    );

    expect(estado.bandeja.tickets).toEqual([ticketAsignado]);
    expect(estado.bandeja.filtros).toEqual({ id_estado: 3 });
  });

  it('un error conserva los tickets y guarda el motivo', () => {
    const estado = aplicar(cargando(1), cargada(1, [ticketPendiente]), cargando(2), {
      type: ACCIONES_TICKETS.BANDEJA_FALLIDA,
      error: ERROR,
      solicitud: 2,
    });

    expect(estado.bandeja).toMatchObject({
      tickets: [ticketPendiente],
      estado: ESTADOS_CARGA.ERROR,
      error: ERROR,
    });
  });

  it('ignora el error de una petición vieja', () => {
    const estado = aplicar(cargando(1), cargando(2), {
      type: ACCIONES_TICKETS.BANDEJA_FALLIDA,
      error: ERROR,
      solicitud: 1,
    });

    expect(estado.bandeja.estado).toBe(ESTADOS_CARGA.CARGANDO);
  });

  it('una respuesta que no es arreglo deja la bandeja vacía', () => {
    expect(aplicar(cargando(1), cargada(1, null)).bandeja.tickets).toEqual([]);
  });
});

describe('ticketsReducer: seguimiento y trazabilidad', () => {
  it('al abrir muestra la fila de la bandeja mientras carga', () => {
    const estado = aplicar(abrir(ID, ticketPendiente));

    expect(estado.seguimiento).toMatchObject({
      idIncidencia: ID,
      incidencia: ticketPendiente,
      historial: [],
      estado: ESTADOS_CARGA.CARGANDO,
    });
  });

  it('guarda el detalle y el historial de la incidencia abierta', () => {
    const estado = aplicar(abrir(ID), cargado(ticketClasificado, historialTicket));

    expect(estado.seguimiento).toMatchObject({
      incidencia: ticketClasificado,
      historial: historialTicket,
      estado: ESTADOS_CARGA.LISTO,
      error: null,
    });
  });

  it('recargar la misma incidencia conserva lo que ya se muestra', () => {
    const estado = aplicar(abrir(ID), cargado(ticketPendiente, historialTicket), abrir(ID));

    expect(estado.seguimiento.historial).toEqual(historialTicket);
    expect(estado.seguimiento.incidencia).toEqual(ticketPendiente);
    expect(estado.seguimiento.estado).toBe(ESTADOS_CARGA.CARGANDO);
  });

  it('abrir otra incidencia limpia el historial anterior', () => {
    const estado = aplicar(
      abrir(ID),
      cargado(ticketPendiente, historialTicket),
      abrir(OTRA.id_incidencia)
    );

    expect(estado.seguimiento.historial).toEqual([]);
    expect(estado.seguimiento.incidencia).toBeNull();
  });

  it('ignora la respuesta de una incidencia que ya no está abierta', () => {
    const estado = aplicar(
      abrir(ID),
      abrir(OTRA.id_incidencia),
      cargado(ticketPendiente, historialTicket)
    );

    expect(estado.seguimiento.idIncidencia).toBe(OTRA.id_incidencia);
    expect(estado.seguimiento.historial).toEqual([]);
  });

  it('un error de la incidencia abierta queda guardado', () => {
    const estado = aplicar(abrir(ID), {
      type: ACCIONES_TICKETS.SEGUIMIENTO_FALLIDO,
      idIncidencia: ID,
      error: ERROR,
    });

    expect(estado.seguimiento).toMatchObject({ estado: ESTADOS_CARGA.ERROR, error: ERROR });
  });

  it('ignora el error de una incidencia que ya no está abierta', () => {
    const estado = aplicar(abrir(OTRA.id_incidencia), {
      type: ACCIONES_TICKETS.SEGUIMIENTO_FALLIDO,
      idIncidencia: ID,
      error: ERROR,
    });

    expect(estado.seguimiento.error).toBeNull();
  });

  it('no abre nada sin id', () => {
    expect(aplicar(abrir(null))).toBe(estadoInicialTickets);
  });

  it('cerrar el seguimiento no toca la bandeja', () => {
    const estado = aplicar(
      cargando(1),
      cargada(1, [ticketPendiente]),
      abrir(ID),
      cargado(ticketPendiente, historialTicket),
      { type: ACCIONES_TICKETS.SEGUIMIENTO_CERRADO }
    );

    expect(estado.seguimiento).toEqual(estadoInicialTickets.seguimiento);
    expect(estado.bandeja.tickets).toEqual([ticketPendiente]);
  });
});
