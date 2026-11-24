// Estado local de las notificaciones recibidas (RF8). Es un reducer puro: el
// contexto le despacha acciones y las pruebas lo ejercitan sin React ni API.

export const ESTADOS_NOTIFICACIONES = {
  INACTIVO: 'inactivo',
  CARGANDO: 'cargando',
  LISTO: 'listo',
  ERROR: 'error',
};

export const ACCIONES_NOTIFICACIONES = {
  CARGANDO: 'notificaciones/cargando',
  CARGADAS: 'notificaciones/cargadas',
  FALLIDAS: 'notificaciones/fallidas',
  MARCANDO_LEIDA: 'notificaciones/marcandoLeida',
  MARCADA_LEIDA: 'notificaciones/marcadaLeida',
  MARCAR_LEIDA_FALLIDA: 'notificaciones/marcarLeidaFallida',
};

export const estadoInicialNotificaciones = {
  // GET /notificaciones, de la más reciente a la más antigua.
  notificaciones: [],
  filtros: {},
  estado: ESTADOS_NOTIFICACIONES.INACTIVO,
  error: null, // { mensaje, tipo }
  // Número de la última petición: si llegan dos respuestas, solo vale la última.
  solicitud: 0,
};

function conLeida(estado, idNotificacion, leida) {
  return estado.notificaciones.map((n) =>
    n.id_notificacion === idNotificacion ? { ...n, leida } : n
  );
}

export function notificationsReducer(estado, accion) {
  switch (accion.type) {
    case ACCIONES_NOTIFICACIONES.CARGANDO:
      return {
        ...estado,
        filtros: accion.filtros ?? {},
        estado: ESTADOS_NOTIFICACIONES.CARGANDO,
        error: null,
        solicitud: accion.solicitud,
      };

    case ACCIONES_NOTIFICACIONES.CARGADAS:
      if (accion.solicitud !== estado.solicitud) return estado;

      return {
        ...estado,
        notificaciones: Array.isArray(accion.notificaciones) ? accion.notificaciones : [],
        estado: ESTADOS_NOTIFICACIONES.LISTO,
        error: null,
      };

    case ACCIONES_NOTIFICACIONES.FALLIDAS:
      if (accion.solicitud !== estado.solicitud) return estado;

      // Las anteriores se conservan: la pantalla puede mostrarlas con el aviso.
      return { ...estado, estado: ESTADOS_NOTIFICACIONES.ERROR, error: accion.error };

    case ACCIONES_NOTIFICACIONES.MARCANDO_LEIDA:
      // Se marca al tiro para que el distintivo baje sin esperar a la red.
      return { ...estado, notificaciones: conLeida(estado, accion.idNotificacion, true) };

    case ACCIONES_NOTIFICACIONES.MARCADA_LEIDA: {
      const { notificacion } = accion;

      return {
        ...estado,
        notificaciones: estado.notificaciones.map((n) =>
          n.id_notificacion === notificacion?.id_notificacion ? notificacion : n
        ),
      };
    }

    case ACCIONES_NOTIFICACIONES.MARCAR_LEIDA_FALLIDA:
      // La API no la marcó: vuelve a quedar sin leer.
      return {
        ...estado,
        notificaciones: conLeida(estado, accion.idNotificacion, false),
        error: accion.error,
      };

    default:
      return estado;
  }
}

// Cantidad de notificaciones sin leer (distintivo del ícono).
export function contarNoLeidas(notificaciones = []) {
  return notificaciones.filter((n) => !n.leida).length;
}
