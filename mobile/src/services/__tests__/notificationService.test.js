import { Platform } from 'react-native';

import { ApiError, del, get, patch, post } from '../../api/client';
import {
  cargaPushAsignada,
  dispositivoTecnico,
  notificacionAsignada,
  notificacionAsignadaLeida,
  notificaciones,
  tokenExpo,
} from '../fixtures/notificaciones';
import {
  TIPOS_NOTIFICACION,
  contarNoLeidas,
  darDeBajaDispositivo,
  leerCargaPush,
  listarNotificaciones,
  marcarNotificacionLeida,
  obtenerDispositivoActual,
  olvidarDispositivo,
  registrarDispositivo,
} from '../notificationService';

jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn(async () => null) }));

jest.mock('../../api/client', () => ({
  ...jest.requireActual('../../api/client'),
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));

function errorHttp(status) {
  return new ApiError({ mensaje: 'Error de prueba.', status, tipo: 'http' });
}

beforeEach(() => {
  jest.clearAllMocks();
  [get, post, patch, del].forEach((fn) => fn.mockReset());
  olvidarDispositivo();
});

describe('listarNotificaciones (RF8)', () => {
  it('hace GET /notificaciones y devuelve la lista', async () => {
    get.mockResolvedValueOnce(notificaciones);

    const lista = await listarNotificaciones();

    expect(get).toHaveBeenCalledWith('/notificaciones', {
      params: { leida: undefined, limite: undefined },
    });
    expect(lista).toEqual(notificaciones);
  });

  it('filtra las no leídas con leida: false', async () => {
    get.mockResolvedValueOnce([notificacionAsignada]);

    await listarNotificaciones({ leida: false, limite: 10 });

    expect(get).toHaveBeenCalledWith('/notificaciones', { params: { leida: false, limite: 10 } });
  });

  it('devuelve un arreglo vacío si la respuesta no es una lista', async () => {
    get.mockResolvedValueOnce(null);

    await expect(listarNotificaciones()).resolves.toEqual([]);
  });

  it('contarNoLeidas cuenta solo las que tienen leida en false', () => {
    expect(contarNoLeidas(notificaciones)).toBe(1);
    expect(contarNoLeidas([])).toBe(0);
    expect(contarNoLeidas(undefined)).toBe(0);
  });
});

describe('marcarNotificacionLeida (RF8)', () => {
  it('hace PATCH .../leida sin cuerpo y devuelve la notificación leída', async () => {
    patch.mockResolvedValueOnce(notificacionAsignadaLeida);

    const notificacion = await marcarNotificacionLeida(notificacionAsignada.id_notificacion);

    expect(patch).toHaveBeenCalledWith(
      `/notificaciones/${notificacionAsignada.id_notificacion}/leida`
    );
    expect(notificacion.leida).toBe(true);
    expect(notificacion.fecha_lectura).not.toBeNull();
  });

  it('rechaza sin id y no llama a la API', async () => {
    await expect(marcarNotificacionLeida('')).rejects.toMatchObject({ tipo: 'datos' });
    expect(patch).not.toHaveBeenCalled();
  });

  it('propaga el 404 si la notificación no es del usuario', async () => {
    patch.mockRejectedValueOnce(errorHttp(404));

    await expect(
      marcarNotificacionLeida(notificacionAsignada.id_notificacion)
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('registrarDispositivo (RF8, RNF6)', () => {
  it('hace POST /dispositivos con el token y la plataforma, y lo guarda', async () => {
    post.mockResolvedValueOnce(dispositivoTecnico);

    const dispositivo = await registrarDispositivo(tokenExpo, 'android');

    expect(post).toHaveBeenCalledWith('/dispositivos', {
      token_expo: tokenExpo,
      plataforma: 'android',
    });
    expect(dispositivo).toEqual(dispositivoTecnico);
    expect(obtenerDispositivoActual()).toEqual(dispositivoTecnico);
  });

  it('usa la plataforma del teléfono si no se indica', async () => {
    post.mockResolvedValueOnce(dispositivoTecnico);

    await registrarDispositivo(tokenExpo);

    const [, cuerpo] = post.mock.calls[0];
    expect(cuerpo.plataforma).toBe(Platform.OS);
  });

  it('acepta también el formato nuevo ExpoPushToken[...]', async () => {
    post.mockResolvedValueOnce(dispositivoTecnico);

    await registrarDispositivo('ExpoPushToken[abc123]', 'ios');

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('rechaza un token que no es de Expo sin llamar a la API', async () => {
    await expect(registrarDispositivo('token-cualquiera', 'android')).rejects.toMatchObject({
      tipo: 'datos',
    });
    await expect(registrarDispositivo(undefined, 'android')).rejects.toMatchObject({
      tipo: 'datos',
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('rechaza plataformas sin push (web)', async () => {
    await expect(registrarDispositivo(tokenExpo, 'web')).rejects.toMatchObject({ tipo: 'datos' });
    expect(post).not.toHaveBeenCalled();
  });

  it('si la API falla, no guarda ningún dispositivo', async () => {
    post.mockRejectedValueOnce(errorHttp(500));

    await expect(registrarDispositivo(tokenExpo, 'android')).rejects.toMatchObject({
      status: 500,
    });
    expect(obtenerDispositivoActual()).toBeNull();
  });
});

describe('darDeBajaDispositivo (cierre de sesión)', () => {
  async function registrar() {
    post.mockResolvedValueOnce(dispositivoTecnico);
    await registrarDispositivo(tokenExpo, 'android');
  }

  it('hace DELETE /dispositivos/{id} y olvida el dispositivo', async () => {
    await registrar();
    del.mockResolvedValueOnce(null);

    await expect(darDeBajaDispositivo()).resolves.toBe(true);

    expect(del).toHaveBeenCalledWith(`/dispositivos/${dispositivoTecnico.id_dispositivo}`);
    expect(obtenerDispositivoActual()).toBeNull();
  });

  it('sin dispositivo registrado no llama a la API', async () => {
    await expect(darDeBajaDispositivo()).resolves.toBe(true);
    expect(del).not.toHaveBeenCalled();
  });

  it('no lanza si falla la red: el cierre de sesión sigue', async () => {
    await registrar();
    del.mockRejectedValueOnce(new ApiError({ mensaje: 'Sin conexión.', tipo: 'sin_conexion' }));

    await expect(darDeBajaDispositivo()).resolves.toBe(false);
    expect(obtenerDispositivoActual()).toBeNull();
  });

  it('cuenta el 404 como baja hecha (ya no existía)', async () => {
    await registrar();
    del.mockRejectedValueOnce(errorHttp(404));

    await expect(darDeBajaDispositivo()).resolves.toBe(true);
  });
});

describe('leerCargaPush (CargaNotificacionPush)', () => {
  const datos = { ...cargaPushAsignada };

  it('lee la respuesta del listener al pulsar la notificación', () => {
    const respuesta = { notification: { request: { content: { data: datos } } } };

    expect(leerCargaPush(respuesta)).toEqual(cargaPushAsignada);
  });

  it('lee la notificación recibida y el objeto data directo', () => {
    expect(leerCargaPush({ request: { content: { data: datos } } })).toEqual(cargaPushAsignada);
    expect(leerCargaPush(datos)).toEqual(cargaPushAsignada);
  });

  it('deja id_incidencia en null si no viene', () => {
    const { id_incidencia, ...sinIncidencia } = datos;

    expect(leerCargaPush(sinIncidencia).id_incidencia).toBeNull();
  });

  it('devuelve null si la push no es del SCGI', () => {
    expect(leerCargaPush({ tipo: 'promocion', id_notificacion: 'x' })).toBeNull();
    expect(leerCargaPush({ tipo: TIPOS_NOTIFICACION.CAMBIO_ESTADO })).toBeNull();
    expect(leerCargaPush(null)).toBeNull();
  });
});
