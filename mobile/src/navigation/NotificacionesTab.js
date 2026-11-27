import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import NotificationsScreen from '../screens/incident/NotificationsScreen';

// Pestaña Notificaciones (RF8): conecta la pantalla con el NotificationContext.
// Recarga al entrar a la pestaña; tocar una notificación la marca como leída y
// abre el seguimiento de su incidencia.
export default function NotificacionesTab() {
  const {
    notificaciones,
    cargandoNotificaciones,
    errorNotificaciones,
    loadNotifications,
    refreshNotifications,
    markAsRead,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const marcarTodas = useCallback(() => {
    notificaciones.filter((n) => !n.leida).forEach((n) => markAsRead(n.id_notificacion));
  }, [notificaciones, markAsRead]);

  return (
    <View style={styles.container}>
      {errorNotificaciones && (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorNotificaciones.mensaje}
        </Text>
      )}
      <NotificationsScreen
        notificaciones={notificaciones}
        refrescando={cargandoNotificaciones}
        onRefresh={refreshNotifications}
        onMarcarLeida={markAsRead}
        onMarcarTodasLeidas={marcarTodas}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: '#b91c1c', paddingHorizontal: 20, paddingTop: 12 },
});
