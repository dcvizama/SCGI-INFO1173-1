import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import {
  ACCIONES,
  camposFaltantes,
  construirNuevaIncidencia,
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

export function IncidentProvider({ children }) {
  const [estado, dispatch] = useReducer(incidentReducer, estadoInicial);

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

  const createIncident = useCallback(async () => {
    const faltantes = camposFaltantes(estado.borrador);

    if (faltantes.length > 0) {
      throw new Error(`Faltan datos: ${faltantes.join(', ')}`);
    }

    const incidencia = await crearIncidencia(
      construirNuevaIncidencia(estado.borrador),
      estado.borrador.fotos
    );

    dispatch({ type: ACCIONES.CREADA, incidencia });

    return incidencia;
  }, [estado.borrador]);

  const value = useMemo(
    () => ({
      borrador: estado.borrador,
      incidenciaCreada: estado.incidenciaCreada,
      hayCambios: hayCambios(estado),
      puedeEnviar: camposFaltantes(estado.borrador).length === 0,
      fotosRestantes: MAX_FOTOS - estado.borrador.fotos.length,
      startIncident,
      setField,
      addPhoto,
      removePhoto,
      createIncident,
    }),
    [estado, startIncident, setField, addPhoto, removePhoto, createIncident]
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
