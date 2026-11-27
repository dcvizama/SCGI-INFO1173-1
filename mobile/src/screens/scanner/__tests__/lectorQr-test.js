import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AppFlow from '..';
import { orquestarEscaneo } from '../../../features/qr/scanController';

// Escaneo con el lector de códigos del sistema (RF2): el botón abre el lector y
// el código leído pasa por el mismo flujo que la cámara en vivo.

let mockAlLeer = null;
let mockCamara = null;
let mockEntorno = 'storeClient';
let mockPermiso = null;

jest.mock('expo-camera', () => {
  const CameraView = (props) => {
    mockCamara = props;
    return null;
  };
  CameraView.isModernBarcodeScannerAvailable = true;
  CameraView.launchScanner = jest.fn(async () => {});
  CameraView.dismissScanner = jest.fn(async () => {});
  CameraView.onModernBarcodeScanned = jest.fn((alLeer) => {
    mockAlLeer = alLeer;
    return { remove: jest.fn() };
  });
  return { CameraView, useCameraPermissions: () => [mockPermiso, jest.fn()] };
});
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get executionEnvironment() {
      return mockEntorno;
    },
  },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));
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
  mockAlLeer = null;
  mockCamara = null;
  mockEntorno = 'storeClient';
  mockPermiso = null;
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

it('si se cierra el lector sin leer nada, no muestra error', async () => {
  const { Alert } = require('react-native');
  const { CameraView } = require('expo-camera');
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  CameraView.launchScanner.mockRejectedValueOnce(
    Object.assign(new Error('Barcode scanning was cancelled'), {
      code: 'ERR_BARCODE_SCANNING_CANCELLED',
    })
  );
  await montar();

  await act(async () => {
    await fireEvent.press(await screen.findByText('Escanear código QR'));
  });

  expect(alerta).not.toHaveBeenCalled();
  expect(screen.queryByText('No se pudo leer el código')).toBeNull();
  expect(orquestarEscaneo).not.toHaveBeenCalled();
  alerta.mockRestore();
});

it('si el equipo no existe, avisa en pantalla y deja escanear otro código', async () => {
  orquestarEscaneo.mockResolvedValueOnce({
    accion: 'ir_a_busqueda',
    titulo: 'No encontrado',
    mensaje: 'El activo no existe.',
    historial: ['UCT-ABC-9999'],
  });
  await montar();
  await fireEvent.press(await screen.findByText('Escanear código QR'));

  await act(async () => {
    mockAlLeer({ type: 'qr', data: 'UCT-ABC-9999' });
  });

  expect(screen.getByText('Equipo no encontrado')).toBeTruthy();
  expect(screen.getByText(/No hay un equipo registrado con el código UCT-ABC-9999/)).toBeTruthy();
  expect(screen.queryByText('Consultando equipo…')).toBeNull();

  // El botón vuelve a estar disponible y la siguiente lectura se consulta.
  await fireEvent.press(screen.getByText('Escanear código QR'));
  expect(screen.queryByText('Equipo no encontrado')).toBeNull();
  await act(async () => {
    mockAlLeer({ type: 'qr', data: 'UCT-INF-1024' });
  });
  expect(orquestarEscaneo).toHaveBeenLastCalledWith('UCT-INF-1024', 'TECNICO');
  expect(orquestarEscaneo).toHaveBeenCalledTimes(2);
});

it('si la consulta falla, avisa y libera el escáner', async () => {
  orquestarEscaneo.mockRejectedValueOnce(new Error('sin red'));
  await montar();
  await fireEvent.press(await screen.findByText('Escanear código QR'));

  await act(async () => {
    mockAlLeer({ type: 'qr', data: 'UCT-INF-1024' });
  });

  expect(screen.getByText('No se pudo consultar el equipo')).toBeTruthy();
  expect(screen.getByText('Escanear código QR')).toBeTruthy();
});

describe('en el APK', () => {
  beforeEach(() => {
    mockEntorno = 'standalone';
    mockPermiso = { granted: true };
  });

  it('lee con la cámara dentro de la app, sin abrir el lector del sistema', async () => {
    const { CameraView } = require('expo-camera');
    await montar();

    expect(await screen.findByText('Centra el QR dentro del marco')).toBeTruthy();
    expect(screen.queryByText('Escanear código QR')).toBeNull();

    await act(async () => mockCamara.onCameraReady());
    await act(async () => mockCamara.onBarcodeScanned({ type: 'qr', data: 'UCT-INF-1024' }));

    expect(orquestarEscaneo).toHaveBeenCalledWith('UCT-INF-1024', 'TECNICO');
    expect(CameraView.launchScanner).not.toHaveBeenCalled();
  });

  it('no repite la consulta mientras el mismo código siga frente a la cámara', async () => {
    orquestarEscaneo.mockResolvedValue({
      accion: 'ir_a_busqueda',
      titulo: 'No encontrado',
      mensaje: 'El activo no existe.',
    });
    await montar();
    await screen.findByText('Centra el QR dentro del marco');
    await act(async () => mockCamara.onCameraReady());

    await act(async () => mockCamara.onBarcodeScanned({ type: 'qr', data: 'UCT-ABC-9999' }));
    expect(screen.getByText('Equipo no encontrado')).toBeTruthy();
    await act(async () => mockCamara.onBarcodeScanned({ type: 'qr', data: 'UCT-ABC-9999' }));
    expect(orquestarEscaneo).toHaveBeenCalledTimes(1);

    // Otro código sí se consulta de inmediato.
    await act(async () => mockCamara.onBarcodeScanned({ type: 'qr', data: 'UCT-INF-1024' }));
    expect(orquestarEscaneo).toHaveBeenCalledTimes(2);
    expect(orquestarEscaneo).toHaveBeenLastCalledWith('UCT-INF-1024', 'TECNICO');
  });

  it('si la cámara no se ve, permite cambiar al lector del sistema', async () => {
    const { CameraView } = require('expo-camera');
    await montar();

    await fireEvent.press(
      await screen.findByText('¿No se ve la cámara? Usar el lector del sistema')
    );
    await fireEvent.press(screen.getByText('Escanear código QR'));

    expect(CameraView.launchScanner).toHaveBeenCalledWith({ barcodeTypes: ['qr'] });
  });

  it('sin permiso de cámara, ofrece usar el lector del sistema', async () => {
    mockPermiso = { granted: false };
    await montar();

    expect(await screen.findByText('Permiso requerido para usar la cámara')).toBeTruthy();
    await fireEvent.press(screen.getByText('Usar el lector del sistema'));
    expect(screen.getByText('Escanear código QR')).toBeTruthy();
  });
});
