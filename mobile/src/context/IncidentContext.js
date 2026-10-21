import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { ACCIONES, estadoInicial, hayCambios, incidentReducer } from '../state/incidentReducer';

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

  const value = useMemo(
    () => ({
      borrador: estado.borrador,
      hayCambios: hayCambios(estado),
      startIncident,
      setField,
    }),
    [estado, startIncident, setField]
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
