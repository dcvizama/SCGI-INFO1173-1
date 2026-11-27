import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PrivateRoutes from '../PrivateRoutes';
import {
  listarHistorialIncidencia,
  listarIncidencias,
  obtenerIncidencia,
} from '../../services/incidentService';
import {
  historialTicket,
  otroTicket,
  ticketClasificado,
  ticketPendiente,
} from '../../state/__fixtures__/tickets';

// Navegación de la bandeja (SCRUM-115): tab por rol y seguimiento encima de
// los tabs, con la navegación real. La sesión, el escáner y los íconos se simulan.

let mockRol = 'SUPERVISOR';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { nombre: 'Luis', rol: { id_rol: 2, nombre_rol: mockRol } },
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
  mockRol = 'SUPERVISOR';
  jest.clearAllMocks();
  listarIncidencias.mockResolvedValue([ticketPendiente, otroTicket]);
  obtenerIncidencia.mockResolvedValue(ticketClasificado);
  listarHistorialIncidencia.mockResolvedValue(historialTicket);
});

it('el supervisor ve la bandeja con las incidencias', async () => {
  await montar();

  await fireEvent.press(screen.getByText('Bandeja'));

  expect(await screen.findByText(ticketPendiente.titulo)).toBeTruthy();
  expect(screen.getByText(otroTicket.titulo)).toBeTruthy();
  expect(listarIncidencias).toHaveBeenCalled();
});

it('al tocar una incidencia abre su seguimiento con el historial', async () => {
  await montar();
  await fireEvent.press(screen.getByText('Bandeja'));

  await fireEvent.press(await screen.findByText(ticketPendiente.titulo));

  expect(obtenerIncidencia).toHaveBeenCalledWith(ticketPendiente.id_incidencia);
  expect(listarHistorialIncidencia).toHaveBeenCalledWith(ticketPendiente.id_incidencia);
  expect(await screen.findByText('Historial')).toBeTruthy();
  expect(await screen.findByText(historialTicket[1].comentario)).toBeTruthy();
});

it('el técnico también tiene bandeja', async () => {
  mockRol = 'TECNICO';
  await montar();
  expect(screen.getByText('Bandeja')).toBeTruthy();
});

it('el administrador no tiene bandeja', async () => {
  mockRol = 'ADMINISTRADOR';
  await montar();

  expect(screen.queryByText('Bandeja')).toBeNull();
});

it('si la bandeja no carga, muestra el motivo', async () => {
  listarIncidencias.mockRejectedValue({ mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' });
  await montar();

  await fireEvent.press(screen.getByText('Bandeja'));

  expect(await screen.findByText('No pudimos conectarnos.')).toBeTruthy();
});
