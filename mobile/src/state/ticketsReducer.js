// Estado de la bandeja de incidencias y del seguimiento de una incidencia
// (RF5, RF6). Es un reducer puro, separado del borrador del reporte: cancelar
// un reporte no debe vaciar la bandeja, y cada parte se prueba por su cuenta.

export const ESTADOS_CARGA = {
  INACTIVO: 'inactivo',
  CARGANDO: 'cargando',
  LISTO: 'listo',
  ERROR: 'error',
};

export const ACCIONES_TICKETS = {
  BANDEJA_CARGANDO: 'tickets/bandejaCargando',
  BANDEJA_CARGADA: 'tickets/bandejaCargada',
  BANDEJA_FALLIDA: 'tickets/bandejaFallida',
  SEGUIMIENTO_ABIERTO: 'tickets/seguimientoAbierto',
  SEGUIMIENTO_CARGADO: 'tickets/seguimientoCargado',
  SEGUIMIENTO_FALLIDO: 'tickets/seguimientoFallido',
  SEGUIMIENTO_CERRADO: 'tickets/seguimientoCerrado',
};

export const estadoInicialTickets = {
  // Listado de incidencias (GET /incidencias) con los filtros con que se pidió.
  bandeja: {
    tickets: [],
    filtros: {},
    estado: ESTADOS_CARGA.INACTIVO,
    error: null, // { mensaje, tipo }
    // Número de la última petición: si llegan dos respuestas, solo vale la última.
    solicitud: 0,
  },
  // Incidencia abierta y su trazabilidad (GET /incidencias/{id} y .../historial).
  seguimiento: {
    idIncidencia: null,
    incidencia: null,
    historial: [], // HistorialEstado[], del cambio más antiguo al más reciente
    estado: ESTADOS_CARGA.INACTIVO,
    error: null,
  },
};

function idDe(incidencia) {
  return incidencia?.id_incidencia ?? null;
}

// true si la respuesta corresponde a la incidencia que sigue abierta.
function esLaAbierta(estado, idIncidencia) {
  return idIncidencia != null && estado.seguimiento.idIncidencia === idIncidencia;
}

export function ticketsReducer(estado, accion) {
  switch (accion.type) {
    case ACCIONES_TICKETS.BANDEJA_CARGANDO:
      // Mientras recarga se siguen mostrando los tickets anteriores.
      return {
        ...estado,
        bandeja: {
          ...estado.bandeja,
          filtros: accion.filtros ?? {},
          estado: ESTADOS_CARGA.CARGANDO,
          error: null,
          solicitud: accion.solicitud,
        },
      };

    case ACCIONES_TICKETS.BANDEJA_CARGADA:
      if (accion.solicitud !== estado.bandeja.solicitud) return estado;

      return {
        ...estado,
        bandeja: {
          ...estado.bandeja,
          tickets: Array.isArray(accion.tickets) ? accion.tickets : [],
          estado: ESTADOS_CARGA.LISTO,
          error: null,
        },
      };

    case ACCIONES_TICKETS.BANDEJA_FALLIDA:
      if (accion.solicitud !== estado.bandeja.solicitud) return estado;

      // Los tickets anteriores se conservan: la pantalla puede mostrarlos con el aviso.
      return {
        ...estado,
        bandeja: { ...estado.bandeja, estado: ESTADOS_CARGA.ERROR, error: accion.error },
      };

    case ACCIONES_TICKETS.SEGUIMIENTO_ABIERTO: {
      const { idIncidencia, incidencia } = accion;

      if (!idIncidencia) return estado;

      // Recargar la misma incidencia conserva lo que ya se muestra.
      const misma = esLaAbierta(estado, idIncidencia);

      return {
        ...estado,
        seguimiento: {
          idIncidencia,
          // La fila de la bandeja sirve para mostrar algo mientras llega el detalle.
          incidencia: misma ? estado.seguimiento.incidencia : (incidencia ?? null),
          historial: misma ? estado.seguimiento.historial : [],
          estado: ESTADOS_CARGA.CARGANDO,
          error: null,
        },
      };
    }

    case ACCIONES_TICKETS.SEGUIMIENTO_CARGADO:
      // Si mientras tanto se abrió otra incidencia, la respuesta ya no corresponde.
      if (!esLaAbierta(estado, idDe(accion.incidencia))) return estado;

      return {
        ...estado,
        seguimiento: {
          ...estado.seguimiento,
          incidencia: accion.incidencia,
          historial: Array.isArray(accion.historial) ? accion.historial : [],
          estado: ESTADOS_CARGA.LISTO,
          error: null,
        },
      };

    case ACCIONES_TICKETS.SEGUIMIENTO_FALLIDO:
      if (!esLaAbierta(estado, accion.idIncidencia)) return estado;

      return {
        ...estado,
        seguimiento: { ...estado.seguimiento, estado: ESTADOS_CARGA.ERROR, error: accion.error },
      };

    case ACCIONES_TICKETS.SEGUIMIENTO_CERRADO:
      return { ...estado, seguimiento: estadoInicialTickets.seguimiento };

    default:
      return estado;
  }
}
