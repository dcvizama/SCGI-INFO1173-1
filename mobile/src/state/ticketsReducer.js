// Estado de la bandeja de incidencias y del seguimiento de una incidencia
// (RF5, RF6). Es un reducer puro, separado del borrador del reporte: cancelar
// un reporte no debe vaciar la bandeja, y cada parte se prueba por su cuenta.

export const ESTADOS_CARGA = {
  INACTIVO: 'inactivo',
  CARGANDO: 'cargando',
  LISTO: 'listo',
  ERROR: 'error',
};

// Acción del supervisor o del técnico sobre la incidencia abierta
// (clasificar, asignar, cambiar de estado).
export const ESTADOS_ACCION = {
  INACTIVO: 'inactivo',
  ENVIANDO: 'enviando',
  EXITO: 'exito',
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
  ACCION_INICIADA: 'tickets/accionIniciada',
  ACCION_EXITOSA: 'tickets/accionExitosa',
  ACCION_FALLIDA: 'tickets/accionFallida',
  HISTORIAL_ACTUALIZADO: 'tickets/historialActualizado',
  TECNICOS_CARGANDO: 'tickets/tecnicosCargando',
  TECNICOS_CARGADOS: 'tickets/tecnicosCargados',
  TECNICOS_FALLIDOS: 'tickets/tecnicosFallidos',
};

const accionInactiva = { estado: ESTADOS_ACCION.INACTIVO, error: null };

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
    // Última acción sobre esta incidencia: { estado, error }.
    accion: accionInactiva,
  },
  // Técnicos que el supervisor puede asignar (GET /usuarios?rol=TECNICO).
  tecnicos: {
    lista: [],
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

// true si la incidencia sigue cumpliendo los filtros con que se pidió la bandeja.
// Ej.: en la bandeja de pendientes, una incidencia recién clasificada ya no va.
export function cumpleFiltros(incidencia, filtros = {}) {
  const { id_estado, prioridad, id_activo } = filtros;

  if (id_estado != null && incidencia?.estado?.id_estado !== Number(id_estado)) return false;
  if (prioridad && incidencia?.prioridad !== prioridad) return false;
  if (id_activo && incidencia?.id_activo !== id_activo) return false;

  return true;
}

// Reemplaza la incidencia en la bandeja, o la saca si ya no cumple los filtros.
function actualizarEnBandeja(bandeja, incidencia) {
  const id = idDe(incidencia);

  if (!bandeja.tickets.some((ticket) => idDe(ticket) === id)) return bandeja;

  const tickets = cumpleFiltros(incidencia, bandeja.filtros)
    ? bandeja.tickets.map((ticket) => (idDe(ticket) === id ? incidencia : ticket))
    : bandeja.tickets.filter((ticket) => idDe(ticket) !== id);

  return { ...bandeja, tickets };
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
          accion: misma ? estado.seguimiento.accion : accionInactiva,
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

    case ACCIONES_TICKETS.ACCION_INICIADA:
      if (!esLaAbierta(estado, accion.idIncidencia)) return estado;

      return {
        ...estado,
        seguimiento: {
          ...estado.seguimiento,
          accion: { estado: ESTADOS_ACCION.ENVIANDO, error: null },
        },
      };

    case ACCIONES_TICKETS.ACCION_EXITOSA: {
      // incidencia puede venir null: la acción se hizo pero no se pudo leer el
      // resultado (asignación). El contexto la recarga aparte.
      const { idIncidencia, incidencia } = accion;
      const bandeja = incidencia ? actualizarEnBandeja(estado.bandeja, incidencia) : estado.bandeja;

      if (!esLaAbierta(estado, idIncidencia)) return { ...estado, bandeja };

      return {
        ...estado,
        bandeja,
        seguimiento: {
          ...estado.seguimiento,
          incidencia: incidencia ?? estado.seguimiento.incidencia,
          accion: { estado: ESTADOS_ACCION.EXITO, error: null },
        },
      };
    }

    case ACCIONES_TICKETS.ACCION_FALLIDA:
      if (!esLaAbierta(estado, accion.idIncidencia)) return estado;

      return {
        ...estado,
        seguimiento: {
          ...estado.seguimiento,
          accion: { estado: ESTADOS_ACCION.ERROR, error: accion.error },
        },
      };

    case ACCIONES_TICKETS.HISTORIAL_ACTUALIZADO:
      if (!esLaAbierta(estado, accion.idIncidencia) || !Array.isArray(accion.historial)) {
        return estado;
      }

      return { ...estado, seguimiento: { ...estado.seguimiento, historial: accion.historial } };

    case ACCIONES_TICKETS.TECNICOS_CARGANDO:
      return {
        ...estado,
        tecnicos: { ...estado.tecnicos, estado: ESTADOS_CARGA.CARGANDO, error: null },
      };

    case ACCIONES_TICKETS.TECNICOS_CARGADOS:
      return {
        ...estado,
        tecnicos: {
          lista: Array.isArray(accion.tecnicos) ? accion.tecnicos : [],
          estado: ESTADOS_CARGA.LISTO,
          error: null,
        },
      };

    case ACCIONES_TICKETS.TECNICOS_FALLIDOS:
      return {
        ...estado,
        tecnicos: { ...estado.tecnicos, estado: ESTADOS_CARGA.ERROR, error: accion.error },
      };

    default:
      return estado;
  }
}
