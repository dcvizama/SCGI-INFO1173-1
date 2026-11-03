jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn(async () => null) }));

jest.mock('../../api/client', () => ({
  ...jest.requireActual('../../api/client'),
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../cloudinaryService', () => ({
  ...jest.requireActual('../cloudinaryService'),
  subirImagen: jest.fn(),
}));

import { ApiError, get, post } from '../../api/client';
import { subirImagen } from '../cloudinaryService';
import {
  evidenciaProyector,
  incidenciaProyector,
  nuevaIncidenciaProyector,
} from '../fixtures/incidencias';
import {
  ID_TIPO_FOTOGRAFIA,
  adjuntarEvidencia,
  crearIncidencia,
  obtenerIncidencia,
  registrarIncidencia,
  reintentarEvidencias,
} from '../incidentService';

const RUTA_EVIDENCIAS = `/incidencias/${incidenciaProyector.id_incidencia}/evidencias`;

function urlCloudinary(n) {
  return `https://res.cloudinary.com/l75ago2l/image/upload/v1/scgi_incidencias/foto${n}.jpg`;
}

function evidencia(n) {
  return { ...evidenciaProyector, id_evidencia: `ev-${n}`, url_evidencia: urlCloudinary(n) };
}

// Simula el backend: POST /incidencias devuelve la incidencia y
// POST .../evidencias devuelve la evidencia con la URL recibida.
function backendFalso() {
  post.mockImplementation(async (ruta, cuerpo) => {
    if (ruta === '/incidencias') return incidenciaProyector;
    if (ruta === RUTA_EVIDENCIAS) {
      return { ...evidenciaProyector, url_evidencia: cuerpo.url_evidencia };
    }
    throw new Error(`Ruta inesperada: ${ruta}`);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  post.mockReset();
  get.mockReset();
  subirImagen.mockReset();
});

describe('registrarIncidencia', () => {
  it('hace POST /incidencias y devuelve la Incidencia en estado Pendiente', async () => {
    post.mockResolvedValueOnce(incidenciaProyector);

    const incidencia = await registrarIncidencia(nuevaIncidenciaProyector);

    expect(post).toHaveBeenCalledWith('/incidencias', nuevaIncidenciaProyector);
    expect(incidencia.estado.nombre_estado).toBe('Pendiente');
    expect(incidencia.prioridad).toBe('alta');
  });

  it('envía solo los campos de NuevaIncidencia y limpia espacios', async () => {
    post.mockResolvedValueOnce(incidenciaProyector);

    await registrarIncidencia({
      ...nuevaIncidenciaProyector,
      titulo: '  Proyector no enciende  ',
      fotos: ['file:///foto.jpg'],
      estado: 'otro',
    });

    const [, cuerpo] = post.mock.calls[0];
    expect(Object.keys(cuerpo).sort()).toEqual(['descripcion', 'id_activo', 'prioridad', 'titulo']);
    expect(cuerpo.titulo).toBe('Proyector no enciende');
  });

  it('omite prioridad si no viene (el backend usa media)', async () => {
    post.mockResolvedValueOnce(incidenciaProyector);

    const { prioridad, ...sinPrioridad } = nuevaIncidenciaProyector;
    await registrarIncidencia(sinPrioridad);

    const [, cuerpo] = post.mock.calls[0];
    expect(cuerpo).not.toHaveProperty('prioridad');
  });

  it('rechaza sin id_activo y no llama a la API', async () => {
    const { id_activo, ...sinActivo } = nuevaIncidenciaProyector;

    await expect(registrarIncidencia(sinActivo)).rejects.toMatchObject({ tipo: 'datos' });
    expect(post).not.toHaveBeenCalled();
  });

  it('propaga el 404 cuando el activo no existe', async () => {
    post.mockRejectedValueOnce(
      new ApiError({ mensaje: 'No encontramos lo que buscabas.', status: 404, tipo: 'http' }),
    );

    await expect(registrarIncidencia(nuevaIncidenciaProyector)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('adjuntarEvidencia', () => {
  it('hace POST a las evidencias de la incidencia con el tipo fotografía', async () => {
    post.mockResolvedValueOnce(evidenciaProyector);

    const resultado = await adjuntarEvidencia(
      incidenciaProyector.id_incidencia,
      evidenciaProyector.url_evidencia,
    );

    expect(post).toHaveBeenCalledWith(RUTA_EVIDENCIAS, {
      id_tipo_evidencia: ID_TIPO_FOTOGRAFIA,
      url_evidencia: evidenciaProyector.url_evidencia,
    });
    expect(resultado.url_evidencia).toBe(evidenciaProyector.url_evidencia);
  });

  it('propaga el 409 cuando ya hay 5 evidencias', async () => {
    post.mockRejectedValueOnce(
      new ApiError({ mensaje: 'Máximo de evidencias.', status: 409, tipo: 'http' }),
    );

    await expect(
      adjuntarEvidencia(incidenciaProyector.id_incidencia, evidenciaProyector.url_evidencia),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('obtenerIncidencia', () => {
  it('hace GET /incidencias/{id}', async () => {
    get.mockResolvedValueOnce(incidenciaProyector);

    const incidencia = await obtenerIncidencia(incidenciaProyector.id_incidencia);

    expect(get).toHaveBeenCalledWith(`/incidencias/${incidenciaProyector.id_incidencia}`);
    expect(incidencia).toEqual(incidenciaProyector);
  });
});

describe('crearIncidencia (T6: incidencias + Cloudinary)', () => {
  it('sin fotos: crea la incidencia y no sube nada', async () => {
    backendFalso();

    const resultado = await crearIncidencia(nuevaIncidenciaProyector);

    expect(subirImagen).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
    expect(resultado.id_incidencia).toBe(incidenciaProyector.id_incidencia);
    expect(resultado.evidencias).toEqual([]);
    expect(resultado.evidenciasPendientes).toEqual([]);
    expect(resultado.errorEvidencias).toBeNull();
  });

  it('con fotos: sube cada una y adjunta su secure_url como evidencia', async () => {
    backendFalso();
    subirImagen
      .mockResolvedValueOnce({ url_evidencia: urlCloudinary(1) })
      .mockResolvedValueOnce({ url_evidencia: urlCloudinary(2) });

    const resultado = await crearIncidencia(nuevaIncidenciaProyector, [
      'file:///1.jpg',
      { uri: 'file:///2.jpg' },
    ]);

    expect(subirImagen).toHaveBeenNthCalledWith(1, 'file:///1.jpg');
    expect(subirImagen).toHaveBeenNthCalledWith(2, { uri: 'file:///2.jpg' });
    expect(post).toHaveBeenCalledWith(RUTA_EVIDENCIAS, {
      id_tipo_evidencia: ID_TIPO_FOTOGRAFIA,
      url_evidencia: urlCloudinary(2),
    });
    expect(resultado.evidencias.map((e) => e.url_evidencia)).toEqual([
      urlCloudinary(1),
      urlCloudinary(2),
    ]);
    expect(resultado.evidenciasPendientes).toEqual([]);
  });

  it('rechaza más de 5 fotos antes de crear la incidencia', async () => {
    const fotos = Array.from({ length: 6 }, (_, i) => `file:///${i}.jpg`);

    await expect(crearIncidencia(nuevaIncidenciaProyector, fotos)).rejects.toMatchObject({
      tipo: 'archivo',
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('si falla la creación, lanza el error y no sube fotos', async () => {
    post.mockRejectedValueOnce(
      new ApiError({ mensaje: 'El servidor tuvo un problema.', status: 500, tipo: 'http' }),
    );

    await expect(
      crearIncidencia(nuevaIncidenciaProyector, ['file:///1.jpg']),
    ).rejects.toMatchObject({ status: 500 });
    expect(subirImagen).not.toHaveBeenCalled();
  });

  it('si falla una foto, no lanza y devuelve las pendientes', async () => {
    backendFalso();
    const sinRed = new ApiError({ mensaje: 'Sin conexión.', tipo: 'sin_conexion' });
    subirImagen
      .mockResolvedValueOnce({ url_evidencia: urlCloudinary(1) })
      .mockRejectedValueOnce(sinRed);

    const fotos = ['file:///1.jpg', 'file:///2.jpg', 'file:///3.jpg'];
    const resultado = await crearIncidencia(nuevaIncidenciaProyector, fotos);

    expect(resultado.id_incidencia).toBe(incidenciaProyector.id_incidencia);
    expect(resultado.evidencias).toHaveLength(1);
    expect(resultado.evidenciasPendientes).toEqual(['file:///2.jpg', 'file:///3.jpg']);
    expect(resultado.errorEvidencias).toBe(sinRed);
    expect(subirImagen).toHaveBeenCalledTimes(2);
  });
});

describe('reintentarEvidencias', () => {
  it('sube solo las pendientes y las suma a las evidencias ya adjuntas', async () => {
    backendFalso();
    subirImagen
      .mockResolvedValueOnce({ url_evidencia: urlCloudinary(2) })
      .mockResolvedValueOnce({ url_evidencia: urlCloudinary(3) });

    const incidenciaParcial = { ...incidenciaProyector, evidencias: [evidencia(1)] };

    const resultado = await reintentarEvidencias(incidenciaParcial, [
      'file:///2.jpg',
      'file:///3.jpg',
    ]);

    expect(resultado.evidencias.map((e) => e.url_evidencia)).toEqual([
      urlCloudinary(1),
      urlCloudinary(2),
      urlCloudinary(3),
    ]);
    expect(resultado.evidenciasPendientes).toEqual([]);
    expect(resultado.errorEvidencias).toBeNull();
  });
});