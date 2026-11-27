import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PrivateRoutes from '../PrivateRoutes';
import { obtenerHistorialFallas } from '../../services/assetService';
import { obtenerIncidencia } from '../../services/incidentService';
import { historialFallasActivo, ticketPendiente } from '../../state/__fixtures__/tickets';

// Navegación de la ficha del activo a su historial de fallas (SCRUM-119), con
// PrivateRoutes real. La ficha se reemplaza por una de prueba con dos activos
// (con y sin id_activo) para no depender de los datos de ejemplo de la real.

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
  listarHistorialIncidencia: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../services/assetService', () => ({ obtenerHistorialFallas: jest.fn() }));
jest.mock('../../screens/scanner', () => () => null);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../screens/asset/AssetDetailScreen', () => {
  const { Button } = require('react-native');
  const { useVerHistorialFallas } = require('../useVerHistorialFallas');

  return function FichaDePrueba() {
    const verHistorialFallas = useVerHistorialFallas();

    return (
      <>
        <Button
          title="Historial con id"
          onPress={() =>
            verHistorialFallas({
              id_activo: 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21',
              codigo_qr: 'UCT-INF-1024',
              nombre: 'Proyector sala 3',
            })
          }
        />
        <Button
          title="Historial sin id"
          onPress={() => verHistorialFallas({ codigo_qr: 'ACT-ELEC-0142' })}
        />
      </>
    );
  };
});

async function abrirFicha() {
  await render(
    <NavigationContainer>
      <PrivateRoutes />
    </NavigationContainer>
  );
  await fireEvent.press(screen.getByText('Activo (test)'));
}

beforeEach(() => {
  mockRol = 'TECNICO';
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  obtenerHistorialFallas.mockResolvedValue(historialFallasActivo);
});

afterEach(() => {
  Alert.alert.mockRestore();
});

it('abre el historial de fallas del activo por su id_activo', async () => {
  await abrirFicha();

  await fireEvent.press(await screen.findByText('Historial con id'));

  expect(obtenerHistorialFallas).toHaveBeenCalledWith('a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21');
  expect(await screen.findByText('Proyector sala 3')).toBeTruthy();
  expect(await screen.findByText('Total fallas')).toBeTruthy();
  expect(screen.getByText('Abiertas')).toBeTruthy();
  expect(screen.getByText('Imagen con franjas de color')).toBeTruthy();
});

it('si el activo no trae id_activo, avisa y no abre el historial', async () => {
  await abrirFicha();

  await fireEvent.press(await screen.findByText('Historial sin id'));

  expect(Alert.alert).toHaveBeenCalledWith(
    'Falta el activo',
    'Vuelve a escanear o buscar el activo.'
  );
  expect(obtenerHistorialFallas).not.toHaveBeenCalled();
});

it('desde una falla se abre su seguimiento', async () => {
  obtenerIncidencia.mockResolvedValue(ticketPendiente);
  await abrirFicha();
  await fireEvent.press(await screen.findByText('Historial con id'));

  await fireEvent.press(await screen.findByText(ticketPendiente.titulo));

  expect(obtenerIncidencia).toHaveBeenCalledWith(ticketPendiente.id_incidencia);
  expect(await screen.findByText('Historial')).toBeTruthy();
});

it('si el historial no carga, muestra el motivo y permite reintentar', async () => {
  obtenerHistorialFallas
    .mockRejectedValueOnce({ mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' })
    .mockResolvedValueOnce(historialFallasActivo);
  await abrirFicha();
  await fireEvent.press(await screen.findByText('Historial con id'));

  expect(await screen.findByText('No pudimos conectarnos.')).toBeTruthy();

  await fireEvent.press(screen.getByText('Reintentar'));

  expect(await screen.findByText('Imagen con franjas de color')).toBeTruthy();
  expect(obtenerHistorialFallas).toHaveBeenCalledTimes(2);
});
