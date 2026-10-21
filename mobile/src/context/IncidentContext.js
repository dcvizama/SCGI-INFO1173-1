import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import {
  ACCIONES,
  camposFaltantes,
  construirNuevaIncidencia,
  estadoInicial,
  hayCambios,
  incidentReducer,
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

  const createIncident = useCallback(async () => {
    const faltantes = camposFaltantes(estado.borrador);

    if (faltantes.length > 0) {
      throw new Error(`Faltan datos: ${faltantes.join(', ')}`);
    }

    const incidencia = await crearIncidencia(construirNuevaIncidencia(estado.borrador));

    dispatch({ type: ACCIONES.CREADA, incidencia });

    return incidencia;
  }, [estado.borrador]);

  const value = useMemo(
    () => ({
      borrador: estado.borrador,
      incidenciaCreada: estado.incidenciaCreada,
      hayCambios: hayCambios(estado),
      puedeEnviar: camposFaltantes(estado.borrador).length === 0,
      startIncident,
      setField,
      createIncident,
    }),
    [estado, startIncident, setField, createIncident]
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
