import { getToken } from '../storage/secureStorage';

// Cliente HTTP de la app: todas las peticiones a la API pasan por aquí.
// Se encarga de la baseURL, del token JWT, del timeout, de los errores
// y de comprobar que la comunicación viaje cifrada.

// EXPO_PUBLIC_API_URL apunta a la raíz de la API (.env). La versión del
// contrato la fija la app, porque es la que implementa.
const API_ROOT = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const API_VERSION = 'v1';
const TIMEOUT_MS = 15000;

export const BASE_URL = `${API_ROOT}/${API_VERSION}`;

// Direcciones de desarrollo local, donde se acepta HTTP.
const DIRECCION_LOCAL =
  /^http:\/\/(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;

// RNF3: fuera del desarrollo local, ninguna petición puede salir sin cifrar.
export function esDireccionSegura(url) {
  if (!url.startsWith('http://')) return true;

  return DIRECCION_LOCAL.test(url);
}

// Error único de la API. Las pantallas muestran `mensaje` y, si necesitan
// distinguir el caso, miran `tipo` o `status`.
export class ApiError extends Error {
  constructor({ mensaje, status = null, tipo }) {
    super(mensaje);
    this.name = 'ApiError';
    this.mensaje = mensaje;
    this.status = status;
    this.tipo = tipo; // 'sin_conexion' | 'timeout' | 'http' | 'no_seguro'
  }
}

// El AuthContext registra aquí su signOut. Así el cierre de sesión por token
// vencido funciona sin que este archivo importe el contexto.
let alPerderSesion = null;

export function setOnUnauthorized(callback) {
  alPerderSesion = callback;
}

function construirUrl(ruta, params) {
  const url = `${BASE_URL}${ruta}`;

  if (!params) return url;

  const partes = Object.entries(params)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`);

  return partes.length > 0 ? `${url}?${partes.join('&')}` : url;
}

function mensajePorEstado(status) {
  switch (status) {
    case 400:
      return 'Los datos enviados no son válidos.';
    case 401:
      return 'Tu sesión no es válida o expiró.';
    case 403:
      return 'No tienes permiso para realizar esta acción.';
    case 404:
      return 'No encontramos lo que buscabas.';
    case 500:
      return 'El servidor tuvo un problema. Intenta más tarde.';
    default:
      return `La petición falló con el código ${status}.`;
  }
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

async function request(ruta, opciones = {}) {
  const {
    metodo = 'GET',
    cuerpo,
    params,
    sinSesion = false, // true en el login: no lleva token ni cierra sesión al fallar
    timeout = TIMEOUT_MS,
  } = opciones;

  const url = construirUrl(ruta, params);

  if (!esDireccionSegura(url)) {
    throw new ApiError({
      mensaje: 'La dirección de la API no usa HTTPS. Revisa EXPO_PUBLIC_API_URL.',
      tipo: 'no_seguro',
    });
  }

  const headers = { Accept: 'application/json' };

  if (!sinSesion) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeout);

  let respuesta;

  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError({
        mensaje: 'El servidor tardó demasiado en responder.',
        tipo: 'timeout',
      });
    }

    throw new ApiError({
      mensaje: 'No pudimos conectarnos. Revisa tu conexión a internet.',
      tipo: 'sin_conexion',
    });
  } finally {
    clearTimeout(temporizador);
  }

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !sinSesion && alPerderSesion) {
      await alPerderSesion();
    }

    throw new ApiError({
      mensaje: datos?.mensaje ?? mensajePorEstado(respuesta.status),
      status: respuesta.status,
      tipo: 'http',
    });
  }

  return datos;
}

export function get(ruta, opciones) {
  return request(ruta, { ...opciones, metodo: 'GET' });
}

export function post(ruta, cuerpo, opciones) {
  return request(ruta, { ...opciones, metodo: 'POST', cuerpo });
}
