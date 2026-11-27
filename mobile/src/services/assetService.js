import { ApiError, get } from '../api/client';

// Servicio de activos (RF2, RF6). Usa las rutas del contrato OpenAPI v1.3.0.
// Guarda en memoria los activos ya consultados para no repetir peticiones:
// al volver a escanear el mismo equipo, la ficha se abre sin esperar al servidor.

const cache = new Map();

// Formato de los identificadores del contrato (RNF7: claves primarias UUID).
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// true si el valor tiene la forma de un UUID (8-4-4-4-12 en hexadecimal).
export function esUuid(valor) {
  return typeof valor === 'string' && FORMATO_UUID.test(valor);
}

function guardarEnCache(activo) {
  if (!activo) return activo;

  cache.set(activo.codigo_qr, activo);
  cache.set(activo.id_activo, activo);

  return activo;
}

// Vacia la cache. Se usa al cerrar sesion y en las pruebas.
export function limpiarCache() {
  cache.clear();
}

// Escaneo: recibe el contenido del codigo QR y devuelve el activo.
// Si el codigo no esta registrado, client.js lanza un ApiError con status 404.
export async function obtenerActivoPorCodigoQr(codigoQr) {
  const guardado = cache.get(codigoQr);

  if (guardado) return guardado;

  const activo = await get(`/activos/codigo-qr/${encodeURIComponent(codigoQr)}`);

  return guardarEnCache(activo);
}

// Busqueda manual: se usa cuando el QR no se puede leer o no esta registrado.
// No lee de la cache, porque los resultados cambian, pero si la alimenta.
export async function buscarActivos(busqueda, limite = 20) {
  const resultados = await get('/activos', { params: { busqueda, limite } });

  if (!Array.isArray(resultados)) return [];

  resultados.forEach(guardarEnCache);

  return resultados;
}

// Ficha abierta desde la busqueda o desde el historial de escaneos.
export async function obtenerActivoPorId(idActivo) {
  const guardado = cache.get(idActivo);

  if (guardado) return guardado;

  const activo = await get(`/activos/${idActivo}`);

  return guardarEnCache(activo);
}

// Historial de fallas de la ficha del activo (RF2, RF6).
// GET /activos/{id_activo}/historial-fallas -> HistorialFallasActivo:
// { id_activo, total_fallas, fallas_abiertas, fallas: ResumenFalla[] },
// con las fallas de la mas reciente a la mas antigua.
// - Recibe el id_activo (UUID, RNF7), no el codigo QR: si no tiene forma de UUID
//   lanza un ApiError de tipo 'datos' sin llamar a la API.
// - No usa la cache, porque el historial cambia con cada cambio de estado.
// - Si el activo no existe, client.js lanza un ApiError con status 404.
export async function obtenerHistorialFallas(idActivo, limite = 20) {
  if (!esUuid(idActivo)) {
    throw new ApiError({
      mensaje: 'El identificador del activo no es valido. Vuelve a abrir la ficha del activo.',
      tipo: 'datos',
    });
  }

  const historial = await get(`/activos/${encodeURIComponent(idActivo)}/historial-fallas`, {
    params: { limite },
  });

  // Asegura un arreglo para que la pantalla pueda mostrar el estado vacio.
  return { ...historial, fallas: Array.isArray(historial?.fallas) ? historial.fallas : [] };
}
