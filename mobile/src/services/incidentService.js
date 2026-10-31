import { ApiError, get, post } from '../api/client';

// Servicio de incidencias (RF3). Usa las rutas del contrato OpenAPI v1.2.0.
// Cada función corresponde a una ruta; el flujo completo con fotos
// (crearIncidencia) se arma encima de estas funciones.

// Tipo de evidencia de las fotos (tabla TIPOS_EVIDENCIA). Debe coincidir
// con los datos semilla de TI2 y del mock.
export const ID_TIPO_FOTOGRAFIA = 1;

// POST /incidencias. Envía solo los campos de NuevaIncidencia: el reportante,
// el estado inicial y la fecha los pone el backend.
export async function registrarIncidencia(nuevaIncidencia) {
  const { id_activo, titulo, descripcion, prioridad } = nuevaIncidencia ?? {};

  if (!id_activo) {
    throw new ApiError({
      mensaje: 'Falta el activo asociado a la incidencia. Vuelve a abrir la ficha del activo.',
      tipo: 'datos',
    });
  }

  const cuerpo = {
    id_activo,
    titulo: (titulo ?? '').trim(),
    descripcion: (descripcion ?? '').trim(),
  };

  // Opcional en el contrato: si no viaja, el backend usa media.
  if (prioridad) cuerpo.prioridad = prioridad;

  return post('/incidencias', cuerpo);
}

// POST /incidencias/{id_incidencia}/evidencias. urlEvidencia es la secure_url
// que devuelve Cloudinary.
export async function adjuntarEvidencia(idIncidencia, urlEvidencia, idTipo = ID_TIPO_FOTOGRAFIA) {
  return post(`/incidencias/${encodeURIComponent(idIncidencia)}/evidencias`, {
    id_tipo_evidencia: idTipo,
    url_evidencia: urlEvidencia,
  });
}

// GET /incidencias/{id_incidencia}.
export async function obtenerIncidencia(idIncidencia) {
  return get(`/incidencias/${encodeURIComponent(idIncidencia)}`);
}