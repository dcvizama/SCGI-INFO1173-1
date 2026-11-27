import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as push from 'expo-notifications';
import useTicketNotifications from '../useTicketNotifications.native';
import { registrarDispositivo, marcarNotificacionLeida } from '../../../services/notificationService';

const mockAbrir = jest.fn(() => true);
jest.mock('../../../navigation/useAbrirSeguimiento', () => ({ useAbrirSeguimiento: () => mockAbrir }));
jest.mock('../../../services/notificationService', () => ({
  ...jest.requireActual('../../../services/notificationService'),
  registrarDispositivo: jest.fn(async () => {}),
  marcarNotificacionLeida: jest.fn(async () => {}),
}));
jest.mock('../../../storage/secureStorage', () => ({}));
jest.mock('expo-notifications');

it.each(['android', 'ios'])('registra, abre el ticket una sola vez y limpia listeners en %s', async sistema => {
  const anterior = Platform.OS;
  Platform.OS = sistema;
  try {
    jest.clearAllMocks();
    push.getPermissionsAsync.mockResolvedValue({ granted: true });
    push.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExpoPushToken[demo]' });
    const respuesta = { notification: { request: { content: { data: {
      tipo: 'incidencia_asignada', id_incidencia: 'ticket-1', id_notificacion: 'aviso-1',
    } } } } };
    push.getLastNotificationResponse.mockReturnValue(respuesta);
    const vista = await renderHook(() => useTicketNotifications(true));
    await waitFor(() => expect(registrarDispositivo).toHaveBeenCalledWith('ExpoPushToken[demo]'));
    push.addNotificationResponseReceivedListener.mock.calls[0][0](respuesta);
    expect(mockAbrir).toHaveBeenCalledTimes(1);
    expect(mockAbrir).toHaveBeenCalledWith('ticket-1');
    expect(marcarNotificacionLeida).toHaveBeenCalledWith('aviso-1');
    await vista.unmount();
    expect(push.addNotificationReceivedListener.mock.results[0].value.remove).toHaveBeenCalled();
  } finally {
    Platform.OS = anterior;
  }
});
