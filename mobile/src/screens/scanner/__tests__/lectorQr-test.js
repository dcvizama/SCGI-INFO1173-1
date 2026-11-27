import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AppFlow from '..';
import { orquestarEscaneo } from '../../../features/qr/scanController';

// Escaneo con el lector de códigos del sistema (RF2): el botón abre el lector y
// el código leído pasa por el mismo flujo que la cámara en vivo.

let mockAlLeer = null;

jest.mock('expo-camera', () => {
  const CameraView = () => null;
  CameraView.isModernBarcodeScannerAvailable = true;
  CameraView.launchScanner = jest.fn(async () => {});
  CameraView.dismissScanner = jest.fn(async () => {});
  CameraView.onModernBarcodeScanned = jest.fn((alLeer) => {
    mockAlLeer = alLeer;
    return { remove: jest.fn() };
  });
  return { CameraView, useCameraPermissions: () => [null, jest.fn()] };
});
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { nombre: 'Marta', rol: { nombre_rol: 'TECNICO' } } }),
}));
jest.mock('../../../features/qr/scanController', () => ({
  orquestarEscaneo: jest.fn(),
}));
jest.mock('../../../features/qr/scanHistory', () => ({
  obtenerHistorialEscaneos: jest.fn(async () => []),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const Stack = createNativeStackNavigator();

async function montar() {
  await render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Escanear" component={AppFlow} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  orquestarEscaneo.mockResolvedValue({ accion: 'alerta', titulo: 'Aviso', mensaje: 'Prueba' });
});

it('abre el lector del sistema sin pedir el permiso de la cámara en vivo', async () => {
  const { CameraView } = require('expo-camera');
  await montar();

  await fireEvent.press(await screen.findByText('Escanear código QR'));

  expect(CameraView.launchScanner).toHaveBeenCalledWith({ barcodeTypes: ['qr'] });
  expect(screen.queryByText('Permiso requerido para usar la cámara')).toBeNull();
});

it('el código leído pasa por el flujo del escaneo', async () => {
  await montar();
  await fireEvent.press(await screen.findByText('Escanear código QR'));

  await act(async () => {
    mockAlLeer({ type: 'qr', data: 'UCT-INF-1024' });
  });

  expect(orquestarEscaneo).toHaveBeenCalledWith('UCT-INF-1024', 'TECNICO');
});
