import {
  buscarActivos,
  limpiarCache,
  obtenerActivoPorCodigoQr,
  obtenerActivoPorId,
} from '../assetService';
import { get, ApiError } from '../../api/client';
import { activoComputador, activoProyector } from '../fixtures/activos';

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
