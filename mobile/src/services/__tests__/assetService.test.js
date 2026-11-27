import {
  buscarActivos,
  esUuid,
  limpiarCache,
  obtenerActivoPorCodigoQr,
  obtenerActivoPorId,
  obtenerHistorialFallas,
} from '../assetService';
import { get, ApiError } from '../../api/client';
import { activoComputador, activoImpresora, activoProyector } from '../fixtures/activos';
import { historialFallasProyector, historialFallasVacio } from '../fixtures/incidencias';

jest.mock('../../api/client', () => {
  const real = jest.requireActual('../../api/client');

  return {
    ApiError: real.ApiError,
    get: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  limpiarCache();
});

describe('assetService', () => {
  it('busca el activo con el codigo leido del QR', async () => {
    get.mockResolvedValue(activoProyector);

    const activo = await obtenerActivoPorCodigoQr('UCT-INF-1024');

    expect(get).toHaveBeenCalledWith('/activos/codigo-qr/UCT-INF-1024');
    expect(activo).toEqual(activoProyector);
  });

  it('no vuelve a consultar el servidor si el activo ya esta en la cache', async () => {
    get.mockResolvedValue(activoProyector);

    await obtenerActivoPorCodigoQr('UCT-INF-1024');
    const segundo = await obtenerActivoPorCodigoQr('UCT-INF-1024');

    expect(get).toHaveBeenCalledTimes(1);
    expect(segundo).toEqual(activoProyector);
  });

  it('vuelve a consultar el servidor despues de limpiar la cache', async () => {
    get.mockResolvedValue(activoProyector);

    await obtenerActivoPorCodigoQr('UCT-INF-1024');
    limpiarCache();
    await obtenerActivoPorCodigoQr('UCT-INF-1024');

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('avisa cuando el codigo no esta registrado', async () => {
    get.mockRejectedValue(
      new ApiError({ mensaje: 'No encontramos lo que buscabas.', status: 404, tipo: 'http' })
    );

    await expect(obtenerActivoPorCodigoQr('UCT-INF-9999')).rejects.toMatchObject({ status: 404 });
  });

  it('hace la busqueda manual con el texto y el limite', async () => {
    get.mockResolvedValue([activoProyector, activoComputador]);

    const resultados = await buscarActivos('sala 3');

    expect(get).toHaveBeenCalledWith('/activos', { params: { busqueda: 'sala 3', limite: 20 } });
    expect(resultados).toHaveLength(2);
  });

  it('deja en la cache los activos encontrados en la busqueda', async () => {
    get.mockResolvedValue([activoProyector]);

    await buscarActivos('proyector');
    const activo = await obtenerActivoPorId(activoProyector.id_activo);

    expect(get).toHaveBeenCalledTimes(1);
    expect(activo).toEqual(activoProyector);
  });

  it('busca el activo por su id cuando no esta en la cache', async () => {
    get.mockResolvedValue(activoComputador);

    const activo = await obtenerActivoPorId(activoComputador.id_activo);

    expect(get).toHaveBeenCalledWith(`/activos/${activoComputador.id_activo}`);
    expect(activo).toEqual(activoComputador);
  });
});

describe('esUuid (RNF7)', () => {
  it('acepta los identificadores con forma de UUID', () => {
    expect(esUuid(activoProyector.id_activo)).toBe(true);
    expect(esUuid(activoProyector.id_activo.toUpperCase())).toBe(true);
  });

  it('rechaza codigos QR, textos vacios y otros valores', () => {
    expect(esUuid(activoProyector.codigo_qr)).toBe(false);
    expect(esUuid('')).toBe(false);
    expect(esUuid(` ${activoProyector.id_activo}`)).toBe(false);
    expect(esUuid(null)).toBe(false);
    expect(esUuid(42)).toBe(false);
  });
});

describe('obtenerHistorialFallas (RF2, RF6)', () => {
  const RUTA = `/activos/${activoProyector.id_activo}/historial-fallas`;

  it('consulta el historial del activo por su UUID con el limite por defecto', async () => {
    get.mockResolvedValue(historialFallasProyector);

    const historial = await obtenerHistorialFallas(activoProyector.id_activo);

    expect(get).toHaveBeenCalledWith(RUTA, { params: { limite: 20 } });
    expect(historial).toEqual(historialFallasProyector);
  });

  it('entrega los totales y las fallas de la mas reciente a la mas antigua', async () => {
    get.mockResolvedValue(historialFallasProyector);

    const historial = await obtenerHistorialFallas(activoProyector.id_activo, 5);

    expect(get).toHaveBeenCalledWith(RUTA, { params: { limite: 5 } });
    expect(historial.total_fallas).toBe(2);
    expect(historial.fallas_abiertas).toBe(1);
    expect(historial.fallas[0].fecha_cierre).toBeNull();
    expect(historial.fallas[1].estado.es_final).toBe(true);
    expect(historial.fallas[0].fecha_creacion > historial.fallas[1].fecha_creacion).toBe(true);
  });

  it('devuelve fallas vacio para un activo que nunca ha fallado', async () => {
    get.mockResolvedValue(historialFallasVacio);

    const historial = await obtenerHistorialFallas(activoImpresora.id_activo);

    expect(historial.total_fallas).toBe(0);
    expect(historial.fallas).toEqual([]);
  });

  it('asegura un arreglo de fallas aunque la respuesta no lo traiga', async () => {
    get.mockResolvedValue({ id_activo: activoImpresora.id_activo, total_fallas: 0 });

    const historial = await obtenerHistorialFallas(activoImpresora.id_activo);

    expect(historial.fallas).toEqual([]);
  });

  it('rechaza un id que no es UUID, como el codigo QR, sin llamar a la API', async () => {
    await expect(obtenerHistorialFallas(activoProyector.codigo_qr)).rejects.toMatchObject({
      tipo: 'datos',
    });
    await expect(obtenerHistorialFallas(undefined)).rejects.toMatchObject({ tipo: 'datos' });
    expect(get).not.toHaveBeenCalled();
  });

  it('no usa la cache: cada consulta va al servidor', async () => {
    get.mockResolvedValue(historialFallasProyector);

    await obtenerHistorialFallas(activoProyector.id_activo);
    await obtenerHistorialFallas(activoProyector.id_activo);

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('avisa cuando el activo no existe (404)', async () => {
    get.mockRejectedValue(
      new ApiError({ mensaje: 'No encontramos lo que buscabas.', status: 404, tipo: 'http' })
    );

    await expect(obtenerHistorialFallas(activoComputador.id_activo)).rejects.toMatchObject({
      status: 404,
    });
  });
});
