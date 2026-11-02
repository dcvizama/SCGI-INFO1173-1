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
import { crearIncidencia, reintentarEvidencias } from '../services/incidentService';

// Estado del reporte de incidencia que comparten la ficha del activo y el formulario.
// Vive dentro de PrivateRoutes: al cerrar sesión se desmonta y el borrador se pierde.
const IncidentContext = createContext(null);

const NOMBRES_CAMPOS = { activo: 'activo', titulo: 'título', descripcion: 'descripción' };

// client.js entrega ApiError con un mensaje listo para mostrar y su tipo
// ('sin_conexion', 'timeout', 'http'...). Cualquier otro error recibe uno genérico.
function aErrorDeEnvio(
  error,
  mensajeGenerico = 'No pudimos crear la incidencia. Intenta de nuevo.'
) {
  return {
    mensaje: error?.mensaje ?? mensajeGenerico,
    tipo: error?.tipo ?? 'desconocido',
  };
}

export function IncidentProvider({ children }) {
  const [estado, dispatch] = useReducer(incidentReducer, estadoInicial);

  // Evita dos envíos si el usuario toca "Enviar" dos veces antes del re-render.
  const enviandoRef = useRef(false);

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
  // Si la incidencia se creó pero alguna foto no se subió, igual es un éxito
  // (reintentar todo la duplicaría): las fotos que faltan quedan en
  // fotosPendientes y se reintentan con retryPhotos.
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

  // Reintenta solo las fotos que no se subieron, sobre la incidencia ya creada.
  // Devuelve la incidencia actualizada, o null si no había nada que reintentar.
  const retryPhotos = useCallback(async () => {
    const incidencia = estado.incidenciaCreada;
    const pendientes = incidencia?.evidenciasPendientes ?? [];

    if (enviandoRef.current || pendientes.length === 0) return null;

    enviandoRef.current = true;
    dispatch({ type: ACCIONES.REINTENTO_FOTOS_INICIADO });

    try {
      const actualizada = await reintentarEvidencias(incidencia, pendientes);

      dispatch({ type: ACCIONES.REINTENTO_FOTOS_TERMINADO, incidencia: actualizada });
      return actualizada;
    } catch (error) {
      // reintentarEvidencias no lanza por una foto fallida; esto cubre lo inesperado.
      const conError = { ...incidencia, errorEvidencias: error };

      dispatch({ type: ACCIONES.REINTENTO_FOTOS_TERMINADO, incidencia: conError });
      return conError;
    } finally {
      enviandoRef.current = false;
    }
  }, [estado.incidenciaCreada]);

  // Descarta el borrador (cancelación del formulario) y deja el estado inicial.
  const cancelIncident = useCallback(() => {
    dispatch({ type: ACCIONES.REINICIAR });
  }, []);

  const value = useMemo(() => {
    const fotosPendientes = estado.incidenciaCreada?.evidenciasPendientes ?? [];

    return {
      borrador: estado.borrador,
      estadoEnvio: estado.estadoEnvio,
      enviando: estado.estadoEnvio === ESTADOS_ENVIO.ENVIANDO,
      error: estado.error,
      incidenciaCreada: estado.incidenciaCreada,
      hayCambios: hayCambios(estado),
      puedeEnviar: camposFaltantes(estado.borrador).length === 0,
      fotosRestantes: MAX_FOTOS - estado.borrador.fotos.length,
      fotosPendientes,
      errorFotos:
        fotosPendientes.length > 0
          ? aErrorDeEnvio(
              estado.incidenciaCreada.errorEvidencias,
              'No pudimos subir algunas fotos. Intenta de nuevo.'
            )
          : null,
      reintentandoFotos: estado.reintentandoFotos,
      startIncident,
      setField,
      addPhoto,
      removePhoto,
      createIncident,
      retryPhotos,
      cancelIncident,
    };
  }, [
    estado,
    startIncident,
    setField,
    addPhoto,
    removePhoto,
    createIncident,
    retryPhotos,
    cancelIncident,
  ]);

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncident() {
  const context = useContext(IncidentContext);

  if (!context) {
    throw new Error('useIncident debe usarse dentro de un IncidentProvider');
  }

  return context;
}
