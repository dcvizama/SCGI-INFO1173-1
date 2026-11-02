import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import PrivateRoutes from '../PrivateRoutes';
import { crearIncidencia } from '../../context/mockIncidentService';

// Flujo completo con la navegación real: ficha del activo → formulario → envío
// o cancelación. La sesión, el escáner y los íconos se simulan.

let mockRol = 'REPORTANTE';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { nombre: 'Ana', rol: { id_rol: 1, nombre_rol: mockRol } },
    signOut: jest.fn(),
  }),
}));
jest.mock('../../context/mockIncidentService', () => ({ crearIncidencia: jest.fn() }));
jest.mock('../../screens/scanner', () => () => null);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const TITULO = 'Ej: El proyector no enciende';

async function abrirFormularioDesdeLaFicha() {
  await render(
    <NavigationContainer>
      <PrivateRoutes />
    </NavigationContainer>
  );
  await fireEvent.press(screen.getByText('Activo (test)'));
  await fireEvent.press(await screen.findByText('Reportar incidencia'));
}

beforeEach(() => {
  mockRol = 'REPORTANTE';
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  Alert.alert.mockRestore();
});

it('abre el formulario con el activo de la ficha', async () => {
  await abrirFormularioDesdeLaFicha();

  expect(await screen.findByPlaceholderText(TITULO)).toBeTruthy();
  expect(screen.getByText('ACT-ELEC-0142')).toBeTruthy();
});

it('envía el reporte y muestra la confirmación', async () => {
  crearIncidencia.mockResolvedValue({
    id_incidencia: 'i-1',
    titulo: 'No enciende',
    prioridad: 'media',
    estado: { id_estado: 1, nombre_estado: 'Pendiente' },
    evidencias: [{ url_evidencia: 'file:///simulada/foto.jpg' }],
  });
  await abrirFormularioDesdeLaFicha();

  await fireEvent.changeText(await screen.findByPlaceholderText(TITULO), 'No enciende');
  await fireEvent.changeText(screen.getByPlaceholderText('Describe la falla'), 'Sin luz');
  await fireEvent.press(screen.getByText('Agregar foto de prueba'));
  await fireEvent.press(screen.getByText('Enviar reporte'));

  expect(await screen.findByText('Incidencia registrada')).toBeTruthy();
  expect(crearIncidencia).toHaveBeenCalledWith(
    expect.objectContaining({ titulo: 'No enciende', descripcion: 'Sin luz' }),
    [expect.stringMatching(/^file:\/\/\/simulada\//)]
  );
});

it('muestra el error del envío y permite reintentar', async () => {
  crearIncidencia.mockRejectedValue({
    mensaje: 'No pudimos conectarnos. Revisa tu conexión a internet.',
    tipo: 'sin_conexion',
  });
  await abrirFormularioDesdeLaFicha();

  await fireEvent.changeText(await screen.findByPlaceholderText(TITULO), 'No enciende');
  await fireEvent.changeText(screen.getByPlaceholderText('Describe la falla'), 'Sin luz');
  await fireEvent.press(screen.getByText('Enviar reporte'));

  expect(
    await screen.findByText('No pudimos conectarnos. Revisa tu conexión a internet.')
  ).toBeTruthy();
  expect(screen.getByText('Reintentar envío')).toBeTruthy();
  expect(screen.getByDisplayValue('No enciende')).toBeTruthy();
});

it('cancelar con cambios pide confirmación y, al descartar, limpia el formulario', async () => {
  await abrirFormularioDesdeLaFicha();
  await fireEvent.changeText(await screen.findByPlaceholderText(TITULO), 'Algo a medias');

  await fireEvent.press(screen.getByText('Cancelar'));

  expect(Alert.alert).toHaveBeenCalledWith(
    '¿Descartar el reporte?',
    expect.any(String),
    expect.any(Array)
  );
  // Sigue en el formulario hasta que el usuario confirme.
  expect(screen.getByDisplayValue('Algo a medias')).toBeTruthy();

  const botones = Alert.alert.mock.calls[0][2];
  await act(async () => {
    botones.find((boton) => boton.text === 'Descartar').onPress();
  });

  expect(await screen.findByText('DATOS GENERALES')).toBeTruthy();

  await fireEvent.press(screen.getByText('Reportar incidencia'));
  expect((await screen.findByPlaceholderText(TITULO)).props.value).toBe('');
});

it('cancelar sin cambios vuelve a la ficha sin preguntar', async () => {
  await abrirFormularioDesdeLaFicha();
  await screen.findByPlaceholderText(TITULO);

  await fireEvent.press(screen.getByText('Cancelar'));

  expect(await screen.findByText('DATOS GENERALES')).toBeTruthy();
  expect(Alert.alert).not.toHaveBeenCalled();
});

it('el Administrador no puede abrir el reporte', async () => {
  mockRol = 'ADMINISTRADOR';
  await abrirFormularioDesdeLaFicha();

  expect(Alert.alert).toHaveBeenCalledWith('Sin permiso', expect.any(String));
  expect(screen.queryByPlaceholderText(TITULO)).toBeNull();
});
