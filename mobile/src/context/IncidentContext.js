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
// Mock temporal: en la tarea 6 se cambia por '../services/incidentService'.
import { crearIncidencia } from './mockIncidentService';

// Estado del reporte de incidencia que comparten la ficha del activo y el formulario.
// Vive dentro de PrivateRoutes: al cerrar sesión se desmonta y el borrador se pierde.
const IncidentContext = createContext(null);

const NOMBRES_CAMPOS = { activo: 'activo', titulo: 'título', descripcion: 'descripción' };

// client.js entrega ApiError con un mensaje listo para mostrar y su tipo
// ('sin_conexion', 'timeout', 'http'...). Cualquier otro error recibe uno genérico.
function aErrorDeEnvio(error) {
  return {
    mensaje: error?.mensaje ?? 'No pudimos crear la incidencia. Intenta de nuevo.',
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
    }),
    [estado, startIncident, setField, addPhoto, removePhoto, createIncident, cancelIncident]
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
