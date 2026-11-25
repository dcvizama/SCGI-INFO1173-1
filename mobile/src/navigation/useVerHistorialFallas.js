import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RUTAS } from './routes';

// Abre el historial de fallas del activo desde su ficha (RF2, RF6).
// El historial se pide por id_activo (UUID del contrato), no por el código QR:
// si el activo no lo trae, avisa en vez de abrir una pantalla que fallaría.
// Devuelve true si navegó.
export function useVerHistorialFallas() {
  const navigation = useNavigation();

  return useCallback(
    (activo) => {
      if (!activo?.id_activo) {
        Alert.alert('Falta el activo', 'Vuelve a escanear o buscar el activo.');
        return false;
      }

      navigation.navigate(RUTAS.HISTORIAL_FALLAS, { idActivo: activo.id_activo, activo });

      return true;
    },
    [navigation]
  );
}
