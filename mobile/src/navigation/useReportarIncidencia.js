import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useIncident } from '../context/IncidentContext';
import { puedeReportarIncidencia } from './permissions';
import { RUTAS } from './routes';

// Abre el formulario de reporte con el activo ya identificado (RF2 → RF3).
// Lo usa la ficha del activo; el escáner puede usarlo igual cuando lo necesite.
// Devuelve true si navegó, false si el rol o el activo no lo permitían.
export function useReportarIncidencia() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { startIncident } = useIncident();
  const rol = user?.rol?.nombre_rol ?? user?.rol;

  return useCallback(
    (activo) => {
      if (!puedeReportarIncidencia(rol)) {
        Alert.alert('Sin permiso', 'Tu rol no permite reportar incidencias.');
        return false;
      }

      if (!activo) {
        Alert.alert('Falta el activo', 'Escanea o busca el activo antes de reportar.');
        return false;
      }

      startIncident(activo);
      navigation.navigate(RUTAS.REPORTAR_INCIDENCIA, { activo });

      return true;
    },
    [rol, startIncident, navigation]
  );
}
