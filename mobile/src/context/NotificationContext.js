import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import {
  ACCIONES_NOTIFICACIONES,
  contarNoLeidas,
  ESTADOS_NOTIFICACIONES,
  estadoInicialNotificaciones,
  notificationsReducer,
} from '../state/notificationsReducer';
import {
  leerCargaPush,
  listarNotificaciones,
  marcarNotificacionLeida,
} from '../services/notificationService';

// Estado local de las notificaciones recibidas (RF8): la lista del usuario,
// cuántas faltan por leer y qué hacer cuando llega una push. Las crea el
// backend ante los eventos del ciclo de vida; la app solo las consulta y las
// marca como leídas, siempre a través de services/notificationService.
//
// Se monta dentro de PrivateRoutes (como IncidentProvider) para que al cerrar
// sesión se pierda todo. Depende de notificationService.js, que llega a dev con
// el PR de Cristóbal: por eso se monta junto con la pantalla de notificaciones.
const NotificationContext = createContext(null);

function aError(error, mensajeGenerico) {
  return {
    mensaje: error?.mensaje ?? mensajeGenerico,
    tipo: error?.tipo ?? 'desconocido',
  };
}

export function NotificationProvider({ children }) {
  const [estado, dispatch] = useReducer(notificationsReducer, estadoInicialNotificaciones);

  // Numera las peticiones: solo se aplica la respuesta de la última.
  const solicitudRef = useRef(0);
  // Filtros de la última carga, para recargar sin repetirlos.
  const filtrosRef = useRef({});

  // Carga las notificaciones del usuario. filtros: { leida, limite }.
  // Devuelve la lista, o null si falló (el motivo queda en errorNotificaciones).
  const loadNotifications = useCallback(async (filtros = {}) => {
    solicitudRef.current += 1;
    const solicitud = solicitudRef.current;
    filtrosRef.current = filtros;

    dispatch({ type: ACCIONES_NOTIFICACIONES.CARGANDO, filtros, solicitud });

    try {
      const notificaciones = await listarNotificaciones(filtros);

      dispatch({ type: ACCIONES_NOTIFICACIONES.CARGADAS, notificaciones, solicitud });
      return notificaciones;
    } catch (error) {
      dispatch({
        type: ACCIONES_NOTIFICACIONES.FALLIDAS,
        error: aError(error, 'No pudimos cargar las notificaciones. Intenta de nuevo.'),
        solicitud,
      });
      return null;
    }
  }, []);

  const refreshNotifications = useCallback(
    () => loadNotifications(filtrosRef.current),
    [loadNotifications]
  );

  // Marca una notificación como leída. Se ve leída al tiro; si la API falla,
  // vuelve a quedar sin leer. Devuelve la notificación actualizada o null.
  const markAsRead = useCallback(async (idNotificacion) => {
    if (!idNotificacion) return null;

    dispatch({ type: ACCIONES_NOTIFICACIONES.MARCANDO_LEIDA, idNotificacion });

    try {
      const notificacion = await marcarNotificacionLeida(idNotificacion);

      dispatch({ type: ACCIONES_NOTIFICACIONES.MARCADA_LEIDA, notificacion });
      return notificacion;
    } catch (error) {
      dispatch({
        type: ACCIONES_NOTIFICACIONES.MARCAR_LEIDA_FALLIDA,
        idNotificacion,
        error: aError(error, 'No pudimos marcar la notificación como leída.'),
      });
      return null;
    }
  }, []);

  // Para el listener de expo-notifications: recibe la push (o la respuesta al
  // pulsarla), y si es del SCGI y todavía no está en la lista, la recarga.
  // Devuelve { id_notificacion, id_incidencia, tipo } para que quien escucha
  // abra el seguimiento de la incidencia, o null si no es del SCGI.
  const notificacionesActuales = estado.notificaciones;
  const receivePush = useCallback(
    async (entrada) => {
      const carga = leerCargaPush(entrada);

      if (!carga) return null;

      const yaEsta = notificacionesActuales.some(
        (n) => n.id_notificacion === carga.id_notificacion
      );
      if (!yaEsta) await loadNotifications(filtrosRef.current);

      return carga;
    },
    [notificacionesActuales, loadNotifications]
  );

  const value = useMemo(
    () => ({
      notificaciones: estado.notificaciones,
      noLeidas: contarNoLeidas(estado.notificaciones),
      estadoNotificaciones: estado.estado,
      cargandoNotificaciones: estado.estado === ESTADOS_NOTIFICACIONES.CARGANDO,
      errorNotificaciones: estado.error,
      loadNotifications,
      refreshNotifications,
      markAsRead,
      receivePush,
    }),
    [estado, loadNotifications, refreshNotifications, markAsRead, receivePush]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }

  return context;
}
