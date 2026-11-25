import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useIncident } from '../context/IncidentContext';
import { RUTAS } from './routes';

// Abre el seguimiento de una incidencia desde la bandeja (o desde una
// notificación): pide su detalle y su historial, y navega a la pantalla.
// Acepta la incidencia de la bandeja (se muestra mientras carga) o su id.
// Devuelve true si navegó.
export function useAbrirSeguimiento() {
  const navigation = useNavigation();
  const { openTicket } = useIncident();

  return useCallback(
    (incidenciaOId) => {
      const idIncidencia =
        typeof incidenciaOId === 'string' ? incidenciaOId : incidenciaOId?.id_incidencia;

      if (!idIncidencia) return false;

      openTicket(incidenciaOId);
      navigation.navigate(RUTAS.SEGUIMIENTO_INCIDENCIA, { idIncidencia });

      return true;
    },
    [openTicket, navigation]
  );
}
