import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import {
  ACCIONES,
  camposFaltantes,
  construirNuevaIncidencia,
  ESTADOS_ENVIO,
  estadoInicial,
  hayCambios,
  incidentReducer,
  MAX_FOTOS,
} from '../state/incidentReducer';
import {
  ACCIONES_TICKETS,
  ESTADOS_ACCION,
  ESTADOS_CARGA,
  estadoInicialTickets,
  ticketsReducer,
} from '../state/ticketsReducer';
import {
  asignarIncidencia,
  clasificarIncidencia,
  listarHistorialIncidencia,
  listarIncidencias,
  listarTecnicos,
  obtenerIncidencia,
} from '../services/incidentService';
// Mock temporal: en la tarea 6 se cambia por '../services/incidentService'.
import { crearIncidencia } from './mockIncidentService';

// Estado de las incidencias que comparten las pantallas privadas:
// - el borrador del reporte (ficha del activo y formulario, RF3),
// - la bandeja de tickets y el seguimiento de uno con su trazabilidad (RF5, RF6).
// Vive dentro de PrivateRoutes: al cerrar sesión se desmonta y todo se pierde.
const IncidentContext = createContext(null);

const NOMBRES_CAMPOS = { activo: 'activo', titulo: 'título', descripcion: 'descripción' };

// client.js entrega ApiError con un mensaje listo para mostrar y su tipo
// ('sin_conexion', 'timeout', 'http'...). Cualquier otro error recibe uno genérico.
function aError(error, mensajeGenerico) {
  return {
    mensaje: error?.mensaje ?? mensajeGenerico,
    tipo: error?.tipo ?? 'desconocido',
  };
}

function aErrorDeEnvio(error) {
  return aError(error, 'No pudimos crear la incidencia. Intenta de nuevo.');
}

export function IncidentProvider({ children }) {
  const [estado, dispatch] = useReducer(incidentReducer, estadoInicial);
  const [tickets, dispatchTickets] = useReducer(ticketsReducer, estadoInicialTickets);

  // Evita dos envíos si el usuario toca "Enviar" dos veces antes del re-render.
  const enviandoRef = useRef(false);
  // Numera las peticiones de la bandeja: solo se aplica la respuesta de la última.
  const solicitudRef = useRef(0);
  // Filtros de la última carga, para recargar la bandeja sin repetirlos.
  const filtrosRef = useRef({});
  // Evita dos acciones a la vez sobre la incidencia abierta (doble toque).
  const accionRef = useRef(false);

  // Abre un reporte para el activo identificado (escaneo QR o búsqueda).
  const startIncident = useCallback((activo) => {
    dispatch({ type: ACCIONES.INICIAR, activo });
  }, []);

  // campo: 'titulo' | 'descripcion' | 'prioridad'
  const setField = useCallback((campo, valor) => {
    dispatch({ type: ACCIONES.CAMBIAR_CAMPO, campo, valor });
  }, []);

  // Guarda una o varias fotos (URI o { uri }) en el borrador, antes de subirlas.
  const addPhoto = useCallback((fotos) => {
    dispatch({ type: ACCIONES.AGREGAR_FOTOS, fotos });
  }, []);

  const removePhoto = useCallback((uri) => {
    dispatch({ type: ACCIONES.QUITAR_FOTO, uri });
  }, []);

  // Envía el borrador. Devuelve la Incidencia creada, o null si no se pudo:
  // en ese caso el motivo queda en `error` y el borrador se conserva.
  const createIncident = useCallback(async () => {
    if (enviandoRef.current) return null;

    const faltantes = camposFaltantes(estado.borrador);

    if (faltantes.length > 0) {
      dispatch({
        type: ACCIONES.ENVIO_FALLIDO,
        error: {
          mensaje: `Completa: ${faltantes.map((campo) => NOMBRES_CAMPOS[campo]).join(', ')}.`,
          tipo: 'validacion',
        },
      });
      return null;
    }

    enviandoRef.current = true;
    dispatch({ type: ACCIONES.ENVIO_INICIADO });

    try {
      const incidencia = await crearIncidencia(
        construirNuevaIncidencia(estado.borrador),
        estado.borrador.fotos
      );

      dispatch({ type: ACCIONES.ENVIO_EXITOSO, incidencia });
      return incidencia;
    } catch (error) {
      dispatch({ type: ACCIONES.ENVIO_FALLIDO, error: aErrorDeEnvio(error) });
      return null;
    } finally {
      enviandoRef.current = false;
    }
  }, [estado.borrador]);

  // Descarta el borrador (cancelación del formulario) y deja el estado inicial.
  const cancelIncident = useCallback(() => {
    dispatch({ type: ACCIONES.REINICIAR });
  }, []);

  // Carga la bandeja. filtros: { id_activo, id_estado, prioridad, limite }.
  // Ej.: bandeja del supervisor -> loadTickets({ id_estado: ESTADOS.PENDIENTE_REVISION }).
  // Devuelve los tickets, o null si falló (el motivo queda en errorTickets).
  const loadTickets = useCallback(async (filtros = {}) => {
    solicitudRef.current += 1;
    const solicitud = solicitudRef.current;
    filtrosRef.current = filtros;

    dispatchTickets({ type: ACCIONES_TICKETS.BANDEJA_CARGANDO, filtros, solicitud });

    try {
      const lista = await listarIncidencias(filtros);

      dispatchTickets({ type: ACCIONES_TICKETS.BANDEJA_CARGADA, tickets: lista, solicitud });
      return lista;
    } catch (error) {
      dispatchTickets({
        type: ACCIONES_TICKETS.BANDEJA_FALLIDA,
        error: aError(error, 'No pudimos cargar las incidencias. Intenta de nuevo.'),
        solicitud,
      });
      return null;
    }
  }, []);

  // Vuelve a pedir la bandeja con los mismos filtros (tirar para actualizar).
  const refreshTickets = useCallback(() => loadTickets(filtrosRef.current), [loadTickets]);

  // Abre el seguimiento de una incidencia: su detalle y su historial de estados.
  // Acepta el id o la incidencia de la bandeja (se muestra mientras carga).
  // Devuelve { incidencia, historial }, o null si falló.
  const openTicket = useCallback(async (incidenciaOId) => {
    const idIncidencia =
      typeof incidenciaOId === 'string' ? incidenciaOId : incidenciaOId?.id_incidencia;

    if (!idIncidencia) return null;

    dispatchTickets({
      type: ACCIONES_TICKETS.SEGUIMIENTO_ABIERTO,
      idIncidencia,
      incidencia: typeof incidenciaOId === 'string' ? null : incidenciaOId,
    });

    try {
      const [incidencia, historial] = await Promise.all([
        obtenerIncidencia(idIncidencia),
        listarHistorialIncidencia(idIncidencia),
      ]);

      dispatchTickets({ type: ACCIONES_TICKETS.SEGUIMIENTO_CARGADO, incidencia, historial });
      return { incidencia, historial };
    } catch (error) {
      dispatchTickets({
        type: ACCIONES_TICKETS.SEGUIMIENTO_FALLIDO,
        idIncidencia,
        error: aError(error, 'No pudimos cargar la incidencia. Intenta de nuevo.'),
      });
      return null;
    }
  }, []);

  // Recarga la incidencia abierta (por ejemplo, después de un cambio de estado).
  const idTicketAbierto = tickets.seguimiento.idIncidencia;
  const refreshTicket = useCallback(
    () => (idTicketAbierto ? openTicket(idTicketAbierto) : Promise.resolve(null)),
    [idTicketAbierto, openTicket]
  );

  const closeTicket = useCallback(() => {
    dispatchTickets({ type: ACCIONES_TICKETS.SEGUIMIENTO_CERRADO });
  }, []);

  // Mecánica común de las acciones sobre la incidencia abierta: marca la acción
  // en curso, llama al servicio y actualiza el ticket en el seguimiento y en la
  // bandeja. Después vuelve a pedir el historial, que ganó un registro; si eso
  // falla, queda el anterior (la pantalla puede usar refreshTicket).
  // llamada(idIncidencia) devuelve la incidencia actualizada, o null si la acción
  // se hizo pero no se pudo leer el resultado: en ese caso se recarga completa.
  // Devuelve la incidencia actualizada, o null si no se pudo.
  const ejecutarAccion = useCallback(
    async (llamada, mensajeGenerico) => {
      const idIncidencia = idTicketAbierto;

      if (!idIncidencia || accionRef.current) return null;

      accionRef.current = true;
      dispatchTickets({ type: ACCIONES_TICKETS.ACCION_INICIADA, idIncidencia });

      try {
        const incidencia = await llamada(idIncidencia);

        dispatchTickets({ type: ACCIONES_TICKETS.ACCION_EXITOSA, idIncidencia, incidencia });

        if (!incidencia) {
          const recargada = await openTicket(idIncidencia);
          return recargada?.incidencia ?? null;
        }

        try {
          const historial = await listarHistorialIncidencia(idIncidencia);
          dispatchTickets({
            type: ACCIONES_TICKETS.HISTORIAL_ACTUALIZADO,
            idIncidencia,
            historial,
          });
        } catch {
          // El cambio ya quedó hecho; solo falta refrescar la línea de tiempo.
        }

        return incidencia;
      } catch (error) {
        dispatchTickets({
          type: ACCIONES_TICKETS.ACCION_FALLIDA,
          idIncidencia,
          error: aError(error, mensajeGenerico),
        });
        return null;
      } finally {
        accionRef.current = false;
      }
    },
    [idTicketAbierto, openTicket]
  );

  // Supervisor (RF5): fija la prioridad y la incidencia pasa de Pendiente de
  // revisión a Clasificada. clasificacion: { prioridad, comentario }.
  const classifyIncident = useCallback(
    (clasificacion) =>
      ejecutarAccion(
        (idIncidencia) => clasificarIncidencia(idIncidencia, clasificacion),
        'No pudimos clasificar la incidencia. Intenta de nuevo.'
      ),
    [ejecutarAccion]
  );

  // Supervisor (RF5): asigna un técnico (crea la orden de trabajo) y la
  // incidencia pasa a Asignada.
  const assignIncident = useCallback(
    (idTecnico) =>
      ejecutarAccion(async (idIncidencia) => {
        const { incidencia } = await asignarIncidencia(idIncidencia, idTecnico);
        return incidencia;
      }, 'No pudimos asignar la incidencia. Intenta de nuevo.'),
    [ejecutarAccion]
  );

  // Opciones del selector de técnico al asignar. Devuelve la lista o null.
  const loadTechnicians = useCallback(async () => {
    dispatchTickets({ type: ACCIONES_TICKETS.TECNICOS_CARGANDO });

    try {
      const tecnicos = await listarTecnicos();

      dispatchTickets({ type: ACCIONES_TICKETS.TECNICOS_CARGADOS, tecnicos });
      return tecnicos;
    } catch (error) {
      dispatchTickets({
        type: ACCIONES_TICKETS.TECNICOS_FALLIDOS,
        error: aError(error, 'No pudimos cargar los técnicos. Intenta de nuevo.'),
      });
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      borrador: estado.borrador,
      estadoEnvio: estado.estadoEnvio,
      enviando: estado.estadoEnvio === ESTADOS_ENVIO.ENVIANDO,
      error: estado.error,
      incidenciaCreada: estado.incidenciaCreada,
      hayCambios: hayCambios(estado),
      puedeEnviar: camposFaltantes(estado.borrador).length === 0,
      fotosRestantes: MAX_FOTOS - estado.borrador.fotos.length,
      startIncident,
      setField,
      addPhoto,
      removePhoto,
      createIncident,
      cancelIncident,
      // Bandeja (RF5)
      tickets: tickets.bandeja.tickets,
      filtrosTickets: tickets.bandeja.filtros,
      estadoTickets: tickets.bandeja.estado,
      cargandoTickets: tickets.bandeja.estado === ESTADOS_CARGA.CARGANDO,
      errorTickets: tickets.bandeja.error,
      loadTickets,
      refreshTickets,
      // Seguimiento y trazabilidad (RF6)
      ticketActual: tickets.seguimiento.incidencia,
      historialTicket: tickets.seguimiento.historial,
      estadoTicket: tickets.seguimiento.estado,
      cargandoTicket: tickets.seguimiento.estado === ESTADOS_CARGA.CARGANDO,
      errorTicket: tickets.seguimiento.error,
      openTicket,
      refreshTicket,
      closeTicket,
      // Acciones sobre la incidencia abierta (RF5, RF6)
      estadoAccion: tickets.seguimiento.accion.estado,
      procesandoAccion: tickets.seguimiento.accion.estado === ESTADOS_ACCION.ENVIANDO,
      errorAccion: tickets.seguimiento.accion.error,
      classifyIncident,
      assignIncident,
      // Técnicos para asignar (RF5)
      tecnicos: tickets.tecnicos.lista,
      estadoTecnicos: tickets.tecnicos.estado,
      errorTecnicos: tickets.tecnicos.error,
      loadTechnicians,
    }),
    [
      estado,
      tickets,
      startIncident,
      setField,
      addPhoto,
      removePhoto,
      createIncident,
      cancelIncident,
      loadTickets,
      refreshTickets,
      openTicket,
      refreshTicket,
      closeTicket,
      classifyIncident,
      assignIncident,
      loadTechnicians,
    ]
  );

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncident() {
  const context = useContext(IncidentContext);

  if (!context) {
    throw new Error('useIncident debe usarse dentro de un IncidentProvider');
  }

  return context;
}
