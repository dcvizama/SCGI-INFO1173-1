import { ApiError, get, post } from '../api/client';
import { MAX_FOTOS, subirImagen } from './cloudinaryService';

// Servicio de incidencias (RF3, RF4). Usa las rutas del contrato OpenAPI v1.2.0.
// Las funciones de una sola ruta (registrar, adjuntar, obtener) se combinan en
// crearIncidencia, que es la que usa el IncidentContext.

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

// Sube cada foto a Cloudinary y la registra como evidencia, de a una y en orden.
// Se detiene en la primera falla: si no hay red, seguir solo sumaría esperas.
async function adjuntarFotos(idIncidencia, fotos) {
  const evidencias = [];

  for (let i = 0; i < fotos.length; i += 1) {
    try {
      const { url_evidencia } = await subirImagen(fotos[i]);
      evidencias.push(await adjuntarEvidencia(idIncidencia, url_evidencia));
    } catch (error) {
      return { evidencias, evidenciasPendientes: fotos.slice(i), errorEvidencias: error };
    }
  }

  return { evidencias, evidenciasPendientes: [], errorEvidencias: null };
}

// Flujo completo del reporte (RF3 + RF4).
// - Si falla la creación de la incidencia, lanza el ApiError (no se creó nada).
// - Si la incidencia se creó pero falla alguna foto, NO lanza: devuelve la
//   incidencia con evidenciasPendientes y errorEvidencias, para no duplicar
//   la incidencia al reintentar. Las fotos se reintentan con reintentarEvidencias.
//
// fotos: URIs locales o los objetos { uri } de expo-camera / expo-image-picker.
export async function crearIncidencia(nuevaIncidencia, fotos = []) {
  if (fotos.length > MAX_FOTOS) {
    throw new ApiError({
      mensaje: `Puedes adjuntar como máximo ${MAX_FOTOS} fotos.`,
      tipo: 'archivo',
    });
  }

  const incidencia = await registrarIncidencia(nuevaIncidencia);
  const resultado = await adjuntarFotos(incidencia.id_incidencia, fotos);

  return {
    ...incidencia,
    ...resultado,
    evidencias: [...(incidencia.evidencias ?? []), ...resultado.evidencias],
  };
}

// Reintenta solo las fotos que no alcanzaron a subirse, sobre una incidencia
// ya creada. Devuelve la incidencia actualizada con la misma forma.
export async function reintentarEvidencias(incidencia, fotosPendientes) {
  const resultado = await adjuntarFotos(incidencia.id_incidencia, fotosPendientes);

  return {
    ...incidencia,
    ...resultado,
    evidencias: [...(incidencia.evidencias ?? []), ...resultado.evidencias],
  };
}