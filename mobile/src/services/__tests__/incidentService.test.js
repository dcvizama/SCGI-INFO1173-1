jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn(async () => null) }));

jest.mock('../../api/client', () => ({
  ...jest.requireActual('../../api/client'),
  get: jest.fn(),
  post: jest.fn(),
}));

import { ApiError, get, post } from '../../api/client';
import {
  evidenciaProyector,
  incidenciaProyector,
  nuevaIncidenciaProyector,
} from '../fixtures/incidencias';
import {
  ID_TIPO_FOTOGRAFIA,
  adjuntarEvidencia,
  obtenerIncidencia,
  registrarIncidencia,
} from '../incidentService';

beforeEach(() => {
  jest.clearAllMocks();
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

    const evidencia = await adjuntarEvidencia(
      incidenciaProyector.id_incidencia,
      evidenciaProyector.url_evidencia,
    );

    expect(post).toHaveBeenCalledWith(
      `/incidencias/${incidenciaProyector.id_incidencia}/evidencias`,
      { id_tipo_evidencia: ID_TIPO_FOTOGRAFIA, url_evidencia: evidenciaProyector.url_evidencia },
    );
    expect(evidencia.url_evidencia).toBe(evidenciaProyector.url_evidencia);
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