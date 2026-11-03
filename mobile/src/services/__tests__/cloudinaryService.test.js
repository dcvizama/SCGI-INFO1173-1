jest.mock('../../storage/secureStorage', () => ({
  getToken: jest.fn(async () => 'token-que-no-debe-salir'),
}));

import { ApiError } from '../../api/client';
import { MAX_FOTOS, subirImagen, subirImagenes } from '../cloudinaryService';

const CONFIG = { cloudName: 'demo', uploadPreset: 'preset_prueba' };

function respuestaFalsa(status, cuerpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
  };
}

const RESPUESTA_OK = {
  public_id: 'scgi_incidencias/abc123',
  secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/scgi_incidencias/abc123.jpg',
  width: 800,
  height: 600,
  bytes: 12345,
  format: 'jpg',
};

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('subirImagen', () => {
  it('sube a Cloudinary y devuelve secure_url como url_evidencia', async () => {
    fetch.mockResolvedValueOnce(respuestaFalsa(200, RESPUESTA_OK));

    const resultado = await subirImagen('file:///tmp/foto.jpg', CONFIG);

    expect(resultado.url_evidencia).toBe(RESPUESTA_OK.secure_url);
    expect(resultado.public_id).toBe('scgi_incidencias/abc123');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/upload');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('no envía el token JWT de la app a Cloudinary (RNF3)', async () => {
    fetch.mockResolvedValueOnce(respuestaFalsa(200, RESPUESTA_OK));

    await subirImagen('file:///tmp/foto.jpg', CONFIG);

    const [, init] = fetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('acepta el objeto { uri } de expo-camera', async () => {
    fetch.mockResolvedValueOnce(respuestaFalsa(200, RESPUESTA_OK));

    const resultado = await subirImagen({ uri: 'file:///tmp/foto.png' }, CONFIG);

    expect(resultado.url_evidencia).toBe(RESPUESTA_OK.secure_url);
  });

  it('rechaza una foto sin URI sin llamar a la red', async () => {
    await expect(subirImagen({}, CONFIG)).rejects.toMatchObject({ tipo: 'archivo' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('avisa si falta la configuración de Cloudinary', async () => {
    await expect(
      subirImagen('file:///tmp/foto.jpg', { cloudName: '', uploadPreset: '' }),
    ).rejects.toMatchObject({ tipo: 'configuracion' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('traduce un 400 de Cloudinary a ApiError en español', async () => {
    fetch.mockResolvedValueOnce(
      respuestaFalsa(400, { error: { message: 'File size too large' } }),
    );

    const promesa = subirImagen('file:///tmp/foto.jpg', CONFIG);

    await expect(promesa).rejects.toBeInstanceOf(ApiError);
    await expect(promesa).rejects.toMatchObject({
      status: 400,
      tipo: 'http',
      detalle: 'File size too large',
    });
  });

  it('marca sin_conexion cuando no hay red', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(subirImagen('file:///tmp/foto.jpg', CONFIG)).rejects.toMatchObject({
      tipo: 'sin_conexion',
    });
  });

  it('marca timeout cuando la subida se corta por tiempo', async () => {
    const abortado = new Error('Aborted');
    abortado.name = 'AbortError';
    fetch.mockRejectedValueOnce(abortado);

    await expect(subirImagen('file:///tmp/foto.jpg', CONFIG)).rejects.toMatchObject({
      tipo: 'timeout',
    });
  });
});

describe('subirImagenes', () => {
  it('sube varias fotos en orden', async () => {
    fetch
      .mockResolvedValueOnce(respuestaFalsa(200, { ...RESPUESTA_OK, public_id: 'a' }))
      .mockResolvedValueOnce(respuestaFalsa(200, { ...RESPUESTA_OK, public_id: 'b' }));

    const subidas = await subirImagenes(['file:///1.jpg', 'file:///2.jpg'], CONFIG);

    expect(subidas.map((s) => s.public_id)).toEqual(['a', 'b']);
  });

  it(`rechaza más de ${MAX_FOTOS} fotos`, async () => {
    const fotos = Array.from({ length: MAX_FOTOS + 1 }, (_, i) => `file:///${i}.jpg`);

    await expect(subirImagenes(fotos, CONFIG)).rejects.toMatchObject({ tipo: 'archivo' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('si una falla, informa cuáles alcanzaron a subirse', async () => {
    fetch
      .mockResolvedValueOnce(respuestaFalsa(200, RESPUESTA_OK))
      .mockResolvedValueOnce(respuestaFalsa(500));

    const error = await subirImagenes(['file:///1.jpg', 'file:///2.jpg'], CONFIG).catch((e) => e);

    expect(error.subidas).toHaveLength(1);
    expect(error.indiceFallido).toBe(1);
  });
});