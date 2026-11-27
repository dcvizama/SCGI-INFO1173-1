import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PrivateRoutes from '../PrivateRoutes';
import {
  listarHistorialIncidencia,
  listarIncidencias,
  obtenerIncidencia,
} from '../../services/incidentService';
import { listarNotificaciones, marcarNotificacionLeida } from '../../services/notificationService';
import { historialTicket, ticketPendiente } from '../../state/__fixtures__/tickets';
import {
  notificacionAsignada,
  notificacionAsignadaLeida,
  notificacionCambioEstado,
} from '../../state/__fixtures__/notificaciones';

// Pestaña Notificaciones (RF8): la lista sale del NotificationContext, tocar un
// aviso lo marca como leído y abre el seguimiento de su incidencia.

let mockRol = 'TECNICO';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { nombre: 'Marta', rol: { id_rol: 3, nombre_rol: mockRol } },
    signOut: jest.fn(),
  }),
}));
jest.mock('../../services/incidentService', () => ({
  ...jest.requireActual('../../services/incidentService'),
  listarTransiciones: jest.fn(async () => []),
  listarIncidencias: jest.fn(),
  obtenerIncidencia: jest.fn(),
  listarHistorialIncidencia: jest.fn(),
}));
jest.mock('../../services/notificationService', () => ({
  ...jest.requireActual('../../services/notificationService'),
  listarNotificaciones: jest.fn(),
  marcarNotificacionLeida: jest.fn(),
}));
jest.mock('../../screens/scanner', () => () => null);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

async function montar() {
  await render(
    <NavigationContainer>
      <PrivateRoutes />
    </NavigationContainer>
  );
}

beforeEach(() => {
  mockRol = 'TECNICO';
  jest.clearAllMocks();
  listarIncidencias.mockResolvedValue([ticketPendiente]);
  obtenerIncidencia.mockResolvedValue(ticketPendiente);
  listarHistorialIncidencia.mockResolvedValue(historialTicket);
  listarNotificaciones.mockResolvedValue([notificacionAsignada, notificacionCambioEstado]);
  marcarNotificacionLeida.mockResolvedValue(notificacionAsignadaLeida);
});

it('muestra las notificaciones del usuario al entrar a la pestaña', async () => {
  await montar();

  await fireEvent.press(screen.getByText('Notificaciones'));

  expect(await screen.findByText(notificacionAsignada.titulo)).toBeTruthy();
  expect(screen.getByText(notificacionCambioEstado.titulo)).toBeTruthy();
  expect(screen.getByText('1 sin leer')).toBeTruthy();
  expect(listarNotificaciones).toHaveBeenCalled();
});

it('al tocar una notificación la marca como leída y abre el seguimiento', async () => {
  await montar();
  await fireEvent.press(screen.getByText('Notificaciones'));

  await fireEvent.press(await screen.findByText(notificacionAsignada.titulo));

  expect(marcarNotificacionLeida).toHaveBeenCalledWith(notificacionAsignada.id_notificacion);
  expect(obtenerIncidencia).toHaveBeenCalledWith(notificacionAsignada.id_incidencia);
  expect(await screen.findByText('TRAZABILIDAD DE ESTADOS')).toBeTruthy();
});

it('si no cargan, muestra el motivo', async () => {
  listarNotificaciones.mockRejectedValue({
    mensaje: 'No pudimos conectarnos.',
    tipo: 'sin_conexion',
  });
  await montar();

  await fireEvent.press(screen.getByText('Notificaciones'));

  expect(await screen.findByText('No pudimos conectarnos.')).toBeTruthy();
});

it('el administrador no tiene la pestaña', async () => {
  mockRol = 'ADMINISTRADOR';
  await montar();

  expect(screen.queryByText('Notificaciones')).toBeNull();
});
