import { get } from '../api/client';

// Servicio de activos (RF2). Usa las rutas del contrato OpenAPI v1.1.0.
// Guarda en memoria los activos ya consultados para no repetir peticiones:
// al volver a escanear el mismo equipo, la ficha se abre sin esperar al servidor.

const cache = new Map();

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
