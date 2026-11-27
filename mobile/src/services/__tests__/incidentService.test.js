import { ApiError, get, patch, post } from '../../api/client';
import { subirImagen } from '../cloudinaryService';
import {
  evidenciaProyector,
  historialProyector,
  incidenciaAsignada,
  incidenciaClasificada,
  incidenciaEnDiagnostico,
  incidenciaProyector,
  nuevaIncidenciaProyector,
  ordenProyector,
  transicionesEstado,
} from '../fixtures/incidencias';
import { usuarioTecnico } from '../fixtures/usuarios';
import {
  COMENTARIO_MAX,
  ESTADOS,
  ID_TIPO_FOTOGRAFIA,
  accionesDisponibles,
  adjuntarEvidencia,
  asignarIncidencia,
  cambiarEstadoIncidencia,
  clasificarIncidencia,
  crearIncidencia,
  listarHistorialIncidencia,
  listarIncidencias,
  listarTecnicos,
  listarTransiciones,
  obtenerIncidencia,
  registrarIncidencia,
  reintentarEvidencias,
} from '../incidentService';

jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn(async () => null) }));

jest.mock('../../api/client', () => ({
  ...jest.requireActual('../../api/client'),
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

jest.mock('../cloudinaryService', () => ({
  ...jest.requireActual('../cloudinaryService'),
  subirImagen: jest.fn(),
}));

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
  patch.mockReset();
  subirImagen.mockReset();
});

describe('registrarIncidencia', () => {
  it('hace POST /incidencias y devuelve la Incidencia en Pendiente de revision', async () => {
    post.mockResolvedValueOnce(incidenciaProyector);

    const incidencia = await registrarIncidencia(nuevaIncidenciaProyector);

    expect(post).toHaveBeenCalledWith('/incidencias', nuevaIncidenciaProyector);
    expect(incidencia.estado.id_estado).toBe(ESTADOS.PENDIENTE_REVISION);
    expect(incidencia.estado.nombre_estado).toBe('Pendiente de revision');
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
      new ApiError({ mensaje: 'No encontramos lo que buscabas.', status: 404, tipo: 'http' })
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
      evidenciaProyector.url_evidencia
    );

    expect(post).toHaveBeenCalledWith(RUTA_EVIDENCIAS, {
      id_tipo_evidencia: ID_TIPO_FOTOGRAFIA,
      url_evidencia: evidenciaProyector.url_evidencia,
    });
    expect(resultado.url_evidencia).toBe(evidenciaProyector.url_evidencia);
  });

  it('propaga el 409 cuando ya hay 5 evidencias', async () => {
    post.mockRejectedValueOnce(
      new ApiError({ mensaje: 'Máximo de evidencias.', status: 409, tipo: 'http' })
    );

    await expect(
      adjuntarEvidencia(incidenciaProyector.id_incidencia, evidenciaProyector.url_evidencia)
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
      new ApiError({ mensaje: 'El servidor tuvo un problema.', status: 500, tipo: 'http' })
    );

    await expect(
      crearIncidencia(nuevaIncidenciaProyector, ['file:///1.jpg'])
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

// ---------------------------------------------------------------------------
// Ciclo de vida (RF5, RF6), contra los fixtures del contrato v1.3.0
// ---------------------------------------------------------------------------

const ID = incidenciaProyector.id_incidencia;

function errorHttp(status, mensaje = 'Error de prueba.') {
  return new ApiError({ mensaje, status, tipo: 'http' });
}

describe('listarIncidencias', () => {
  it('arma la bandeja del supervisor con las pendientes de revision', async () => {
    get.mockResolvedValueOnce([incidenciaProyector]);

    const bandeja = await listarIncidencias({ id_estado: ESTADOS.PENDIENTE_REVISION });

    expect(get).toHaveBeenCalledWith('/incidencias', {
      params: {
        id_activo: undefined,
        id_estado: ESTADOS.PENDIENTE_REVISION,
        prioridad: undefined,
        limite: undefined,
      },
    });
    expect(bandeja).toEqual([incidenciaProyector]);
  });

  it('envía solo los filtros del contrato', async () => {
    get.mockResolvedValueOnce([]);

    await listarIncidencias({ prioridad: 'alta', limite: 10, orden: 'desc' });

    const [, { params }] = get.mock.calls[0];
    expect(Object.keys(params).sort()).toEqual(['id_activo', 'id_estado', 'limite', 'prioridad']);
  });
});

describe('listarTecnicos', () => {
  it('hace GET /usuarios filtrando por el rol TECNICO', async () => {
    get.mockResolvedValueOnce([usuarioTecnico]);

    const tecnicos = await listarTecnicos();

    expect(get).toHaveBeenCalledWith('/usuarios', { params: { rol: 'TECNICO' } });
    expect(tecnicos[0].rol.nombre_rol).toBe('TECNICO');
  });
});

describe('clasificarIncidencia (RF5)', () => {
  it('hace PATCH .../clasificacion y devuelve la incidencia Clasificada', async () => {
    patch.mockResolvedValueOnce(incidenciaClasificada);

    const incidencia = await clasificarIncidencia(ID, {
      prioridad: 'media',
      comentario: '  Hay sala de respaldo.  ',
    });

    expect(patch).toHaveBeenCalledWith(`/incidencias/${ID}/clasificacion`, {
      prioridad: 'media',
      comentario: 'Hay sala de respaldo.',
    });
    expect(incidencia.estado.id_estado).toBe(ESTADOS.CLASIFICADA);
  });

  it('no envía el comentario si viene vacío (es opcional)', async () => {
    patch.mockResolvedValueOnce(incidenciaClasificada);

    await clasificarIncidencia(ID, { prioridad: 'alta', comentario: '   ' });

    const [, cuerpo] = patch.mock.calls[0];
    expect(cuerpo).toEqual({ prioridad: 'alta' });
  });

  it('rechaza una prioridad fuera de baja, media o alta sin llamar a la API', async () => {
    await expect(clasificarIncidencia(ID, { prioridad: 'urgente' })).rejects.toMatchObject({
      tipo: 'datos',
    });
    expect(patch).not.toHaveBeenCalled();
  });

  it('propaga el 409 si la incidencia ya no está pendiente', async () => {
    patch.mockRejectedValueOnce(errorHttp(409));

    await expect(clasificarIncidencia(ID, { prioridad: 'media' })).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe('asignarIncidencia (RF5)', () => {
  it('crea la orden de trabajo y devuelve la incidencia Asignada', async () => {
    post.mockResolvedValueOnce(ordenProyector);
    get.mockResolvedValueOnce(incidenciaAsignada);

    const resultado = await asignarIncidencia(ID, usuarioTecnico.id_usuario);

    expect(post).toHaveBeenCalledWith('/ordenes-trabajo', {
      id_incidencia: ID,
      id_tecnico: usuarioTecnico.id_usuario,
    });
    expect(get).toHaveBeenCalledWith(`/incidencias/${ID}`);
    expect(resultado.orden).toEqual(ordenProyector);
    expect(resultado.incidencia.estado.id_estado).toBe(ESTADOS.ASIGNADA);
    expect(resultado.incidencia.id_tecnico_asignado).toBe(usuarioTecnico.id_usuario);
    expect(resultado.errorActualizacion).toBeNull();
  });

  it('rechaza sin técnico y no llama a la API', async () => {
    await expect(asignarIncidencia(ID, '')).rejects.toMatchObject({ tipo: 'datos' });
    expect(post).not.toHaveBeenCalled();
  });

  it('si falla la asignación (409), lanza y no pide la incidencia', async () => {
    post.mockRejectedValueOnce(errorHttp(409));

    await expect(asignarIncidencia(ID, usuarioTecnico.id_usuario)).rejects.toMatchObject({
      status: 409,
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('si la asignación se hizo pero falla la lectura, no lanza', async () => {
    const sinRed = new ApiError({ mensaje: 'Sin conexión.', tipo: 'sin_conexion' });
    post.mockResolvedValueOnce(ordenProyector);
    get.mockRejectedValueOnce(sinRed);

    const resultado = await asignarIncidencia(ID, usuarioTecnico.id_usuario);

    expect(resultado.orden).toEqual(ordenProyector);
    expect(resultado.incidencia).toBeNull();
    expect(resultado.errorActualizacion).toBe(sinRed);
  });
});

describe('cambiarEstadoIncidencia (RF6)', () => {
  it('hace PATCH .../estado con el estado y el comentario limpio', async () => {
    patch.mockResolvedValueOnce(incidenciaEnDiagnostico);

    const incidencia = await cambiarEstadoIncidencia(ID, {
      id_estado: ESTADOS.EN_DIAGNOSTICO,
      comentario: '  Se revisa la fuente de poder.  ',
    });

    expect(patch).toHaveBeenCalledWith(`/incidencias/${ID}/estado`, {
      id_estado: ESTADOS.EN_DIAGNOSTICO,
      comentario: 'Se revisa la fuente de poder.',
    });
    expect(incidencia.estado.id_estado).toBe(ESTADOS.EN_DIAGNOSTICO);
  });

  it('exige el comentario y no llama a la API sin él', async () => {
    await expect(
      cambiarEstadoIncidencia(ID, { id_estado: ESTADOS.EN_DIAGNOSTICO, comentario: '  ' })
    ).rejects.toMatchObject({ tipo: 'datos' });
    expect(patch).not.toHaveBeenCalled();
  });

  it(`rechaza comentarios de más de ${COMENTARIO_MAX} caracteres`, async () => {
    await expect(
      cambiarEstadoIncidencia(ID, {
        id_estado: ESTADOS.EN_DIAGNOSTICO,
        comentario: 'a'.repeat(COMENTARIO_MAX + 1),
      })
    ).rejects.toMatchObject({ tipo: 'datos' });
    expect(patch).not.toHaveBeenCalled();
  });

  it('rechaza Clasificada y Asignada, que tienen ruta propia', async () => {
    for (const id_estado of [ESTADOS.CLASIFICADA, ESTADOS.ASIGNADA]) {
      await expect(
        cambiarEstadoIncidencia(ID, { id_estado, comentario: 'Intento directo.' })
      ).rejects.toMatchObject({ tipo: 'datos' });
    }
    expect(patch).not.toHaveBeenCalled();
  });

  it('propaga el 409 (transición no permitida) y el 403 (rol sin permiso)', async () => {
    const cambio = { id_estado: ESTADOS.CERRADA, comentario: 'Cierre.' };

    patch.mockRejectedValueOnce(errorHttp(409));
    await expect(cambiarEstadoIncidencia(ID, cambio)).rejects.toMatchObject({ status: 409 });

    patch.mockRejectedValueOnce(errorHttp(403));
    await expect(cambiarEstadoIncidencia(ID, cambio)).rejects.toMatchObject({ status: 403 });
  });
});

describe('listarHistorialIncidencia (RF6)', () => {
  it('hace GET .../historial y entrega la trazabilidad en orden', async () => {
    get.mockResolvedValueOnce(historialProyector);

    const historial = await listarHistorialIncidencia(ID);

    expect(get).toHaveBeenCalledWith(`/incidencias/${ID}/historial`);
    expect(historial[0].estado_anterior).toBeNull();
    expect(historial.map((h) => h.estado.id_estado)).toEqual([
      ESTADOS.PENDIENTE_REVISION,
      ESTADOS.CLASIFICADA,
      ESTADOS.ASIGNADA,
      ESTADOS.EN_DIAGNOSTICO,
    ]);
  });
});

describe('transiciones del ciclo de vida (RF6)', () => {
  it('listarTransiciones hace GET con el estado de origen', async () => {
    get.mockResolvedValueOnce(transicionesEstado);

    await listarTransiciones(ESTADOS.RESUELTA);

    expect(get).toHaveBeenCalledWith('/estados-incidencia/transiciones', {
      params: { id_estado_origen: ESTADOS.RESUELTA },
    });
  });

  it('accionesDisponibles filtra por estado actual y rol', () => {
    const destinos = (estado, rol) =>
      accionesDisponibles(transicionesEstado, estado, rol).map((t) => t.id_estado_destino);

    expect(destinos(ESTADOS.RESUELTA, 'SUPERVISOR')).toEqual([
      ESTADOS.VERIFICADA,
      ESTADOS.EN_REPARACION,
    ]);
    expect(destinos(ESTADOS.RESUELTA, 'TECNICO')).toEqual([]);
    expect(destinos(ESTADOS.ASIGNADA, 'TECNICO')).toEqual([ESTADOS.EN_DIAGNOSTICO]);
    expect(destinos(ESTADOS.CERRADA, 'SUPERVISOR')).toEqual([]);
    expect(accionesDisponibles(null, ESTADOS.ASIGNADA, 'TECNICO')).toEqual([]);
  });
});
