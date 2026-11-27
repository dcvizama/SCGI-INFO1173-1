import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAbrirSeguimiento } from '../../navigation/useAbrirSeguimiento';
import {
  leerCargaPush,
  marcarNotificacionLeida,
  registrarDispositivo,
} from '../../services/notificationService';

export default function useTicketNotifications(habilitado) {
  const abrir = useAbrirSeguimiento();
  useEffect(() => {
    if (!habilitado) return;
    const push = require('expo-notifications');
    let activo = true;
    const vistos = new Set();
    function pulsar(respuesta) {
      const carga = leerCargaPush(respuesta);
      if (!activo || !carga?.id_incidencia || vistos.has(carga.id_notificacion)) return;
      if (abrir(carga.id_incidencia)) {
        vistos.add(carga.id_notificacion);
        push.clearLastNotificationResponse();
        marcarNotificacionLeida(carga.id_notificacion).catch(() => {});
      }
    }
    const recepcion = push.addNotificationReceivedListener((aviso) => {
      if (leerCargaPush(aviso))
        Alert.alert(
          aviso.request.content.title || 'Notificación SCGI',
          aviso.request.content.body || '',
          [
            { text: 'Cerrar' },
            { text: 'Ver ticket', onPress: () => pulsar({ notification: aviso }) },
          ]
        );
    });
    const pulsacion = push.addNotificationResponseReceivedListener(pulsar);
    pulsar(push.getLastNotificationResponse());
    async function registrar() {
      // Expo Go no recibe notificaciones remotas (SDK 53+): registrar el
      // dispositivo siempre falla ahí. Se omite; en un build real sí se registra.
      if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
      if (Platform.OS === 'android') {
        await push.setNotificationChannelAsync('default', {
          name: 'Incidencias',
          importance: push.AndroidImportance.HIGH,
        });
      }
      let permiso = await push.getPermissionsAsync();
      if (!permiso.granted && permiso.canAskAgain && activo)
        permiso = await push.requestPermissionsAsync();
      if (!activo || !permiso.granted) return;
      const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
      const token = await push.getExpoPushTokenAsync({ projectId });
      if (activo) await registrarDispositivo(token.data);
    }
    registrar().catch(() => {
      if (activo) Alert.alert('Notificaciones', 'No se pudo registrar este dispositivo.');
    });
    return () => {
      activo = false;
      recepcion.remove();
      pulsacion.remove();
    };
  }, [habilitado, abrir]);
}
