import { get, post, setOnUnauthorized, ApiError } from '../client';
import { getToken } from '../../storage/secureStorage';

jest.mock('../../storage/secureStorage', () => ({
  getToken: jest.fn(),
}));

function respuesta({ ok = true, status = 200, cuerpo = '' }) {
  return { ok, status, text: async () => cuerpo };
}

beforeEach(() => {
  jest.clearAllMocks();
  setOnUnauthorized(null);
  getToken.mockResolvedValue('token-de-prueba');
  global.fetch = jest.fn();
});

describe('client', () => {
  it('agrega el token a la cabecera Authorization', async () => {
    global.fetch.mockResolvedValue(respuesta({ cuerpo: '[]' }));

    await get('/activos');

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.headers.Authorization).toBe('Bearer token-de-prueba');
  });

  it('arma la query y omite los valores vacios', async () => {
    global.fetch.mockResolvedValue(respuesta({ cuerpo: '[]' }));

    await get('/activos', { params: { busqueda: 'sala 3', limite: 20, vacio: null } });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/activos?busqueda=sala%203&limite=20');
  });

  it('el login no manda token ni cierra la sesion cuando responde 401', async () => {
    const cerrarSesion = jest.fn();
    setOnUnauthorized(cerrarSesion);
    global.fetch.mockResolvedValue(
      respuesta({
        ok: false,
        status: 401,
        cuerpo: '{"mensaje":"Correo o contraseña incorrectos."}',
      })
    );

    await expect(
      post('/auth/login', { correo: 'a@uct.cl', password: '12345678' }, { sinSesion: true })
    ).rejects.toMatchObject({ mensaje: 'Correo o contraseña incorrectos.', status: 401 });

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.headers.Authorization).toBeUndefined();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('cierra la sesion cuando una ruta protegida responde 401', async () => {
    const cerrarSesion = jest.fn();
    setOnUnauthorized(cerrarSesion);
    global.fetch.mockResolvedValue(respuesta({ ok: false, status: 401 }));

    await expect(get('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('devuelve un error de tipo timeout cuando el servidor no responde', async () => {
    global.fetch.mockImplementation(
      (url, opciones) =>
        new Promise((_, rechazar) => {
          opciones.signal.addEventListener('abort', () => {
            const error = new Error('abortado');
            error.name = 'AbortError';
            rechazar(error);
          });
        })
    );

    await expect(get('/activos', { timeout: 50 })).rejects.toMatchObject({ tipo: 'timeout' });
  });

  it('devuelve un error de tipo sin_conexion cuando falla la red', async () => {
    global.fetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(get('/activos')).rejects.toMatchObject({ tipo: 'sin_conexion' });
  });

  it('usa el mensaje que manda la API cuando hay un error del servidor', async () => {
    global.fetch.mockResolvedValue(
      respuesta({ ok: false, status: 500, cuerpo: '{"mensaje":"Error interno."}' })
    );

    await expect(get('/activos')).rejects.toMatchObject({
      mensaje: 'Error interno.',
      status: 500,
      tipo: 'http',
    });
  });
});
