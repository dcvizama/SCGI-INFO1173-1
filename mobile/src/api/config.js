// Conmutación del servidor de la API (T8, RF3).
//
// EXPO_PUBLIC_API_DESTINO elige el servidor sin tocar código:
//   mock -> servidor mock propio en Render (por defecto)
//   ti2  -> backend real de Taller de Integración 2
//
// Si se elige ti2 pero su URL no está configurada, se usa el mock
// para que la app siga funcionando en la demostración.
//
// Expo solo reemplaza las variables EXPO_PUBLIC_* escritas de forma literal,
// por eso se leen una por una y no con process.env[nombre].

export const DESTINOS = { MOCK: 'mock', TI2: 'ti2' };

const ENTORNO = {
  destino: process.env.EXPO_PUBLIC_API_DESTINO,
  urlMock: process.env.EXPO_PUBLIC_API_URL_MOCK,
  urlTi2: process.env.EXPO_PUBLIC_API_URL_TI2,
  // Nombre del Sprint 1; se acepta como URL del mock por compatibilidad.
  urlLegada: process.env.EXPO_PUBLIC_API_URL,
};

function limpiarUrl(url) {
  return (url ?? '').trim().replace(/\/+$/, '');
}

// Función pura para poder probar todas las combinaciones del .env.
export function resolverApi(entorno = ENTORNO) {
  const destinoPedido = (entorno.destino ?? DESTINOS.MOCK).trim().toLowerCase();
  const urlMock = limpiarUrl(entorno.urlMock) || limpiarUrl(entorno.urlLegada);
  const urlTi2 = limpiarUrl(entorno.urlTi2);

  if (destinoPedido === DESTINOS.TI2 && urlTi2) {
    return { destino: DESTINOS.TI2, raiz: urlTi2, respaldo: false };
  }

  // Se pidió ti2 sin URL, o un valor desconocido: se usa el mock.
  return {
    destino: DESTINOS.MOCK,
    raiz: urlMock,
    respaldo: destinoPedido !== DESTINOS.MOCK,
  };
}

const API = resolverApi();

if (API.respaldo && typeof __DEV__ !== 'undefined' && __DEV__) {
  console.warn(
    `[api] EXPO_PUBLIC_API_DESTINO no se pudo usar; la app apunta al mock (${API.raiz}).`,
  );
}

export const API_DESTINO = API.destino;
export const API_ROOT = API.raiz;
export const API_ES_RESPALDO = API.respaldo;