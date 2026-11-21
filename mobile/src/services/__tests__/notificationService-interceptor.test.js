// notificationService con el client.js real: comprueba que las notificaciones
// reutilizan el interceptor (token JWT, HTTPS y cierre de sesión por 401).
// Solo se simulan fetch y el almacenamiento seguro del token.

import { setOnUnauthorized } from '../../api/client';
import { getToken } from '../../storage/secureStorage';
import { dispositivoTecnico, tokenExpo } from '../fixtures/notificaciones';
import {
  darDeBajaDispositivo,
  listarNotificaciones,
  olvidarDispositivo,
  registrarDispositivo,
} from '../notificationService';

const RAIZ = 'https://scgi-mock.onrender.com/api';

jest.mock('../../api/config', () => ({ raizDeRuta: () => 'https://scgi-mock.onrender.com/api' }));

jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn() }));

function respuesta({ ok = true, status = 200, cuerpo = '' }) {
  return { ok, status, text: async () => cuerpo };
}

beforeEach(() => {
  jest.clearAllMocks();
  olvidarDispositivo();
  setOnUnauthorized(null);
  getToken.mockResolvedValue('token-de-prueba');
  global.fetch = jest.fn();
});

describe('notificationService reutiliza el interceptor de client.js', () => {
  it('RNF3 y RNF4: va por HTTPS con el token en Authorization', async () => {
    global.fetch.mockResolvedValue(respuesta({ cuerpo: '[]' }));

    await listarNotificaciones({ leida: false });

    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe(`${RAIZ}/v1/notificaciones?leida=false`);
    expect(opciones.method).toBe('GET');
    expect(opciones.headers.Authorization).toBe('Bearer token-de-prueba');
  });

  it('cierra la sesión si la API responde 401', async () => {
    const cerrarSesion = jest.fn();
    setOnUnauthorized(cerrarSesion);
    global.fetch.mockResolvedValue(respuesta({ ok: false, status: 401 }));

    await expect(listarNotificaciones()).rejects.toMatchObject({ status: 401 });
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('la baja del dispositivo con 401 no entra en un ciclo de cierres de sesión', async () => {
    global.fetch.mockResolvedValueOnce(
      respuesta({ status: 201, cuerpo: JSON.stringify(dispositivoTecnico) })
    );
    await registrarDispositivo(tokenExpo, 'android');

    // El cierre de sesión de la app vuelve a llamar a darDeBajaDispositivo.
    const cerrarSesion = jest.fn(() => darDeBajaDispositivo());
    setOnUnauthorized(cerrarSesion);
    global.fetch.mockResolvedValue(respuesta({ ok: false, status: 401 }));

    await expect(darDeBajaDispositivo()).resolves.toBe(false);

    const [url, opciones] = global.fetch.mock.calls[1];
    expect(url).toBe(`${RAIZ}/v1/dispositivos/${dispositivoTecnico.id_dispositivo}`);
    expect(opciones.method).toBe('DELETE');
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('RNF3: si la API no usa HTTPS, no sale ninguna petición', async () => {
    // Carga de nuevo el servicio con una raíz sin cifrar (http hacia un servidor público).
    jest.resetModules();
    jest.doMock('../../api/config', () => ({
      raizDeRuta: () => 'http://scgi-mock.onrender.com/api',
    }));
    const servicio = require('../notificationService');

    await expect(servicio.listarNotificaciones()).rejects.toMatchObject({ tipo: 'no_seguro' });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
