import { ApiError, get, patch, post } from '../api/client';
import { MAX_FOTOS, subirImagen } from './cloudinaryService';

// Servicio de incidencias. Usa las rutas del contrato OpenAPI v1.3.0.
// - Reporte (RF3, RF4): las funciones de una sola ruta (registrar, adjuntar,
//   obtener) se combinan en crearIncidencia, que es la que usa el IncidentContext.
// - Ciclo de vida (RF5, RF6): bandeja, clasificación, asignación, cambio de
//   estado y trazabilidad.
// - Acuerdos con TI2 (entran al contrato en la v1.4.0): prioridad critica,
//   clasificar también cambia la prioridad de una incidencia ya avanzada y se
//   puede asignar técnico sin clasificar antes.

// Tipo de evidencia de las fotos (tabla TIPOS_EVIDENCIA). Debe coincidir
// con los datos semilla de TI2 y del mock.
export const ID_TIPO_FOTOGRAFIA = 1;

// Ids de ESTADOS_INCIDENCIA del contrato v1.3.0. Deben coincidir con los
// datos semilla de TI2 y del mock.
export const ESTADOS = Object.freeze({
  PENDIENTE_REVISION: 1,
  CLASIFICADA: 2,
  ASIGNADA: 3,
  EN_DIAGNOSTICO: 4,
  EN_REPARACION: 5,
  RESUELTA: 6,
  VERIFICADA: 7,
  CERRADA: 8,
});

// Largo máximo del comentario del historial (CambioEstado y Clasificacion).
export const COMENTARIO_MAX = 500;

// Prioridades de una incidencia, de menor a mayor. critica la usa TI2.
export const PRIORIDADES = Object.freeze(['baja', 'media', 'alta', 'critica']);

// Estos destinos necesitan datos extra y tienen ruta propia: no pasan por
// PATCH .../estado (el backend respondería 409).
const DESTINOS_CON_RUTA_PROPIA = [ESTADOS.CLASIFICADA, ESTADOS.ASIGNADA];

function errorDeDatos(mensaje) {
  return new ApiError({ mensaje, tipo: 'datos' });
}

function rutaIncidencia(idIncidencia) {
  return `/incidencias/${encodeURIComponent(idIncidencia)}`;
}

// Limpia el comentario y valida su largo. Devuelve undefined si viene vacío
// y no es obligatorio, para que el campo no viaje.
function limpiarComentario(comentario, obligatorio) {
  const texto = (comentario ?? '').trim();

  if (!texto) {
    if (obligatorio) throw errorDeDatos('Escribe un comentario que explique el cambio de estado.');
    return undefined;
  }

  if (texto.length > COMENTARIO_MAX) {
    throw errorDeDatos(`El comentario puede tener como máximo ${COMENTARIO_MAX} caracteres.`);
  }

  return texto;
}

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

// ---------------------------------------------------------------------------
// Ciclo de vida (RF5, RF6)
// ---------------------------------------------------------------------------

// GET /incidencias. filtros: { id_activo, id_estado, prioridad, limite }.
// Los filtros vacíos no viajan. Bandeja del supervisor:
//   listarIncidencias({ id_estado: ESTADOS.PENDIENTE_REVISION })
export async function listarIncidencias(filtros = {}) {
  const { id_activo, id_estado, prioridad, limite } = filtros;

  return get('/incidencias', { params: { id_activo, id_estado, prioridad, limite } });
}

// GET /usuarios?rol=TECNICO. Opciones del selector de técnico al asignar (RF5).
export async function listarTecnicos() {
  return get('/usuarios', { params: { rol: 'TECNICO' } });
}

// PATCH /incidencias/{id_incidencia}/clasificacion (RF5). El supervisor fija la
// prioridad. Si la incidencia está en Pendiente de revision pasa a Clasificada;
// si ya avanzó, solo cambia la prioridad (en TI2 es alias de .../prioridad).
// clasificacion: { prioridad, comentario } (esquema Clasificacion).
export async function clasificarIncidencia(idIncidencia, clasificacion) {
  const { prioridad, comentario } = clasificacion ?? {};

  if (!idIncidencia) throw errorDeDatos('Falta la incidencia a clasificar.');
  if (!PRIORIDADES.includes(prioridad)) {
    throw errorDeDatos('Elige una prioridad: baja, media, alta o crítica.');
  }

  const cuerpo = { prioridad };
  const texto = limpiarComentario(comentario, false);
  if (texto) cuerpo.comentario = texto;

  return patch(`${rutaIncidencia(idIncidencia)}/clasificacion`, cuerpo);
}

// POST /ordenes-trabajo (RF5). Asigna el técnico y la incidencia pasa a Asignada,
// desde Pendiente de revision o desde Clasificada (no hace falta clasificar antes).
// Después pide la incidencia actualizada, con su estado e id_tecnico_asignado.
// - Si falla la asignación, lanza el ApiError (no se asignó nada).
// - Si la asignación se hizo pero falla la lectura, NO lanza: repetir la
//   asignación respondería 409. Devuelve incidencia: null y errorActualizacion,
//   y la pantalla recarga la incidencia.
export async function asignarIncidencia(idIncidencia, idTecnico) {
  if (!idIncidencia) throw errorDeDatos('Falta la incidencia a asignar.');
  if (!idTecnico) throw errorDeDatos('Elige el técnico responsable.');

  const orden = await post('/ordenes-trabajo', {
    id_incidencia: idIncidencia,
    id_tecnico: idTecnico,
  });

  try {
    const incidencia = await obtenerIncidencia(idIncidencia);
    return { orden, incidencia, errorActualizacion: null };
  } catch (error) {
    return { orden, incidencia: null, errorActualizacion: error };
  }
}

// PATCH /incidencias/{id_incidencia}/estado (RF6). Devuelve la Incidencia con
// su nuevo estado. cambio: { id_estado, comentario } (esquema CambioEstado).
// El contrato deja comentario opcional, pero la app lo exige siempre porque
// es lo que explica el cambio en la trazabilidad.
// Clasificada y Asignada tienen ruta propia: clasificarIncidencia y asignarIncidencia.
export async function cambiarEstadoIncidencia(idIncidencia, cambio) {
  const { id_estado, comentario } = cambio ?? {};

  if (!idIncidencia) throw errorDeDatos('Falta la incidencia a actualizar.');
  if (!Number.isInteger(id_estado)) {
    throw errorDeDatos('Falta el estado al que pasa la incidencia.');
  }
  if (DESTINOS_CON_RUTA_PROPIA.includes(id_estado)) {
    throw errorDeDatos('Para clasificar o asignar una incidencia usa su propia acción.');
  }

  return patch(`${rutaIncidencia(idIncidencia)}/estado`, {
    id_estado,
    comentario: limpiarComentario(comentario, true),
  });
}

// GET /incidencias/{id_incidencia}/historial (RF6). Trazabilidad para la línea
// de tiempo, del cambio más antiguo al más reciente.
export async function listarHistorialIncidencia(idIncidencia) {
  if (!idIncidencia) throw errorDeDatos('Falta la incidencia.');

  return get(`${rutaIncidencia(idIncidencia)}/historial`);
}

// GET /estados-incidencia/transiciones (RF6). Sin argumento trae la matriz completa.
export async function listarTransiciones(idEstadoOrigen) {
  return get('/estados-incidencia/transiciones', {
    params: { id_estado_origen: idEstadoOrigen },
  });
}

// Transiciones que un rol puede hacer desde el estado actual. Función pura:
// la pantalla de seguimiento la usa para mostrar solo las acciones válidas.
export function accionesDisponibles(transiciones, idEstadoActual, nombreRol) {
  return (transiciones ?? []).filter(
    (t) => t.id_estado_origen === idEstadoActual && t.roles_permitidos.includes(nombreRol)
  );
}
