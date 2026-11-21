// Prueba de punta a punta de la conmutación (Sprint 3): con las variables del
// .env de cada escenario, las rutas nuevas de los servicios salen hacia la
// raíz de su microservicio. Solo se simulan fetch y el token.

const MOCK = 'https://scgi-info1173-1.onrender.com/api';
const TI2 = 'https://backend-ti2.example.com/api';
const TI2_NOTIFICACIONES = 'https://notificaciones-ti2.example.com/api';

const ID_ACTIVO = 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21';
const ID_INCIDENCIA = 'd1a2b3c4-5555-4a6b-8c7d-2d7b5a9c0e31';

const VARIABLES = [
  'EXPO_PUBLIC_API_DESTINO',
  'EXPO_PUBLIC_API_URL_MOCK',
  'EXPO_PUBLIC_API_URL_TI2',
  'EXPO_PUBLIC_API_URL_TI2_NOTIFICACIONES',
];

jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn(async () => 'token') }));

// Carga los servicios desde cero con las variables del escenario.
function cargarApp(variables) {
  VARIABLES.forEach((nombre) => delete process.env[nombre]);
  Object.assign(process.env, variables);
  jest.resetModules();

  return {
    activos: require('../../services/assetService'),
    incidencias: require('../../services/incidentService'),
    notificaciones: require('../../services/notificationService'),
  };
}

// Ejecuta las rutas nuevas del Sprint 3 y devuelve las URL que salieron.
async function urlsDeLasRutasNuevas(app) {
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => '[]' }));

  await app.incidencias.listarTecnicos();
  await app.activos.obtenerHistorialFallas(ID_ACTIVO);
  await app.incidencias.cambiarEstadoIncidencia(ID_INCIDENCIA, {
    id_estado: 4,
    comentario: 'Revision.',
  });
  await app.incidencias.listarTransiciones();
  await app.notificaciones.listarNotificaciones();

  return global.fetch.mock.calls.map(([url]) => url);
}

afterAll(() => VARIABLES.forEach((nombre) => delete process.env[nombre]));

describe('las rutas nuevas siguen a la conmutación de baseURL', () => {
  it('con destino mock, todas van al mock de Render', async () => {
    const app = cargarApp({ EXPO_PUBLIC_API_DESTINO: 'mock', EXPO_PUBLIC_API_URL_MOCK: MOCK });

    const urls = await urlsDeLasRutasNuevas(app);

    expect(urls).toEqual([
      `${MOCK}/v1/usuarios?rol=TECNICO`,
      `${MOCK}/v1/activos/${ID_ACTIVO}/historial-fallas?limite=20`,
      `${MOCK}/v1/incidencias/${ID_INCIDENCIA}/estado`,
      `${MOCK}/v1/estados-incidencia/transiciones`,
      `${MOCK}/v1/notificaciones`,
    ]);
  });

  it('con destino ti2, todas van al backend de TI2', async () => {
    const app = cargarApp({
      EXPO_PUBLIC_API_DESTINO: 'ti2',
      EXPO_PUBLIC_API_URL_MOCK: MOCK,
      EXPO_PUBLIC_API_URL_TI2: TI2,
    });

    const urls = await urlsDeLasRutasNuevas(app);

    expect(urls.every((url) => url.startsWith(`${TI2}/v1/`))).toBe(true);
  });

  it('con un microservicio de notificaciones propio, solo esas rutas van a él', async () => {
    const app = cargarApp({
      EXPO_PUBLIC_API_DESTINO: 'ti2',
      EXPO_PUBLIC_API_URL_MOCK: MOCK,
      EXPO_PUBLIC_API_URL_TI2: TI2,
      EXPO_PUBLIC_API_URL_TI2_NOTIFICACIONES: TI2_NOTIFICACIONES,
    });

    const urls = await urlsDeLasRutasNuevas(app);

    expect(urls.slice(0, 4).every((url) => url.startsWith(`${TI2}/v1/`))).toBe(true);
    expect(urls[4]).toBe(`${TI2_NOTIFICACIONES}/v1/notificaciones`);
  });

  it('si TI2 solo publica notificaciones, el resto sigue en el mock', async () => {
    const app = cargarApp({
      EXPO_PUBLIC_API_DESTINO: 'ti2',
      EXPO_PUBLIC_API_URL_MOCK: MOCK,
      EXPO_PUBLIC_API_URL_TI2_NOTIFICACIONES: TI2_NOTIFICACIONES,
    });

    const urls = await urlsDeLasRutasNuevas(app);

    expect(urls.slice(0, 4).every((url) => url.startsWith(`${MOCK}/v1/`))).toBe(true);
    expect(urls[4]).toBe(`${TI2_NOTIFICACIONES}/v1/notificaciones`);
  });
});
