import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useIncident } from '../context/IncidentContext';

// Cancelación del reporte (T9). Si hay cambios sin enviar, pide confirmación
// antes de descartarlos, tanto en el botón "Cancelar" como en el botón atrás
// de Android, el gesto de iOS o la flecha del encabezado.
export function useSalidaDelReporte() {
  const navigation = useNavigation();
  const { hayCambios, enviando, cancelIncident } = useIncident();

  usePreventRemove(hayCambios || enviando, ({ data }) => {
    if (enviando) {
      Alert.alert('Enviando reporte', 'Espera a que termine el envío.');
      return;
    }

    Alert.alert('¿Descartar el reporte?', 'Se perderá lo que escribiste y las fotos agregadas.', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          cancelIncident();
          navigation.dispatch(data.action);
        },
      },
    ]);
  });

  // Sin cambios no hay nada que confirmar: se limpia y se sale. Con cambios,
  // goBack pasa por usePreventRemove, que pregunta antes.
  const cancelar = useCallback(() => {
    if (!hayCambios && !enviando) cancelIncident();
    navigation.goBack();
  }, [hayCambios, enviando, cancelIncident, navigation]);

  return { cancelar };
}
