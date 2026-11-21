import { del, get, patch, post, setOnUnauthorized, ApiError, esDireccionSegura } from '../client';
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
      post(
        '/autenticacion/inicio-sesion',
        { correo: 'a@uct.cl', contrasena: '12345678' },
        { sinSesion: true }
      )
    ).rejects.toMatchObject({ mensaje: 'Correo o contraseña incorrectos.', status: 401 });

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.headers.Authorization).toBeUndefined();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('cierra la sesion cuando una ruta protegida responde 401', async () => {
    const cerrarSesion = jest.fn();
    setOnUnauthorized(cerrarSesion);
    global.fetch.mockResolvedValue(respuesta({ ok: false, status: 401 }));

    await expect(get('/autenticacion/usuario-actual')).rejects.toBeInstanceOf(ApiError);
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

  it('patch envía el metodo PATCH con el cuerpo en JSON y el token', async () => {
    global.fetch.mockResolvedValue(respuesta({ cuerpo: '{"id_incidencia":"i-1"}' }));

    const datos = await patch('/incidencias/i-1/estado', { id_estado: 4, comentario: 'Revision.' });

    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toContain('/incidencias/i-1/estado');
    expect(opciones.method).toBe('PATCH');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(opciones.headers.Authorization).toBe('Bearer token-de-prueba');
    expect(JSON.parse(opciones.body)).toEqual({ id_estado: 4, comentario: 'Revision.' });
    expect(datos).toEqual({ id_incidencia: 'i-1' });
  });

  it('da un mensaje propio al 409 cuando la API no manda uno', async () => {
    global.fetch.mockResolvedValue(respuesta({ ok: false, status: 409 }));

    await expect(patch('/incidencias/i-1/estado', { id_estado: 8 })).rejects.toMatchObject({
      mensaje: 'La acción no es válida para el estado actual.',
      status: 409,
    });
  });

  it('del envía el metodo DELETE sin cuerpo y acepta la respuesta 204 vacía', async () => {
    global.fetch.mockResolvedValue(respuesta({ status: 204 }));

    const datos = await del('/dispositivos/d-1');

    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toContain('/dispositivos/d-1');
    expect(opciones.method).toBe('DELETE');
    expect(opciones.body).toBeUndefined();
    expect(opciones.headers['Content-Type']).toBeUndefined();
    expect(opciones.headers.Authorization).toBe('Bearer token-de-prueba');
    expect(datos).toBeNull();
  });
});

describe('verificacion de HTTPS (RNF3)', () => {
  it('acepta las direcciones cifradas', () => {
    expect(esDireccionSegura('https://scgi-api.onrender.com/api/v1/activos')).toBe(true);
  });

  it('acepta HTTP solo en direcciones locales de desarrollo', () => {
    expect(esDireccionSegura('http://localhost:3000/api/v1/activos')).toBe(true);
    expect(esDireccionSegura('http://192.168.1.20:3000/api/v1/activos')).toBe(true);
  });

  it('rechaza HTTP hacia un servidor publico', () => {
    expect(esDireccionSegura('http://scgi-api.onrender.com/api/v1/activos')).toBe(false);
  });
});
