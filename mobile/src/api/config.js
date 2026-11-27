// Conmutación del servidor de la API (Sprint 2: T8, RF3; Sprint 3: RF5, RF6, RF8).
//
// EXPO_PUBLIC_API_DESTINO elige el servidor sin tocar código:
//   mock -> servidor mock propio en Render (por defecto)
//   ti2  -> backend real de Taller de Integración 2
//
// El contrato define un microservicio por grupo de rutas. Si TI2 publica cada
// microservicio con su propia URL (por ejemplo, una app por servicio en Kubero),
// se indica con EXPO_PUBLIC_API_URL_TI2_<SERVICIO>; si no, todos usan
// EXPO_PUBLIC_API_URL_TI2.
//
// Respaldo: si se elige ti2 y un servicio no tiene URL, ese servicio usa el
// mock para que la app siga funcionando en la demostración.
//
// Expo solo reemplaza las variables EXPO_PUBLIC_* escritas de forma literal,
// por eso se leen una por una y no con process.env[nombre].

export const DESTINOS = { MOCK: 'mock', TI2: 'ti2' };

// Servicios del contrato v1.3.0 y el primer segmento de las rutas que atiende
// cada uno. Las rutas nuevas del Sprint 3 quedan en su servicio:
//   /usuarios -> autenticacion
//   /activos/{id}/historial-fallas -> activos
//   /incidencias/{id}/clasificacion, /estados-incidencia/transiciones -> incidencias
//   /notificaciones, /dispositivos -> notificaciones
export const SERVICIOS = Object.freeze({
  autenticacion: ['autenticacion', 'roles', 'usuarios'],
  activos: [
    'activos',
    'edificios',
    'ubicaciones',
    'categorias',
    'estados-activo',
    'mantenimientos',
  ],
  incidencias: ['incidencias', 'ordenes-trabajo', 'estados-incidencia', 'tipos-evidencia'],
  notificaciones: ['notificaciones', 'dispositivos'],
});

const NOMBRES_SERVICIOS = Object.keys(SERVICIOS);

const ENTORNO = {
  destino: process.env.EXPO_PUBLIC_API_DESTINO,
  urlMock: process.env.EXPO_PUBLIC_API_URL_MOCK,
  urlTi2: process.env.EXPO_PUBLIC_API_URL_TI2,
  // Nombre del Sprint 1; se acepta como URL del mock por compatibilidad.
  urlLegada: process.env.EXPO_PUBLIC_API_URL,
  // URL propia de cada microservicio de TI2 (opcionales).
  urlsTi2: {
    autenticacion: process.env.EXPO_PUBLIC_API_URL_TI2_AUTENTICACION,
    activos: process.env.EXPO_PUBLIC_API_URL_TI2_ACTIVOS,
    incidencias: process.env.EXPO_PUBLIC_API_URL_TI2_INCIDENCIAS,
    notificaciones: process.env.EXPO_PUBLIC_API_URL_TI2_NOTIFICACIONES,
  },
};

function limpiarUrl(url) {
  return (url ?? '').trim().replace(/\/+$/, '');
}

function paraCadaServicio(obtenerRaiz) {
  return Object.fromEntries(NOMBRES_SERVICIOS.map((servicio) => [servicio, obtenerRaiz(servicio)]));
}

// Servicio que atiende una ruta del contrato, según su primer segmento.
// Ej.: '/notificaciones/{id}/leida' -> 'notificaciones'. null si no es del contrato.
export function servicioDeRuta(ruta) {
  const segmento = String(ruta ?? '')
    .replace(/^\/+/, '')
    .split(/[/?]/)[0];

  return NOMBRES_SERVICIOS.find((servicio) => SERVICIOS[servicio].includes(segmento)) ?? null;
}

// Función pura para poder probar todas las combinaciones del .env.
// Devuelve el destino, la raíz general y la raíz de cada servicio.
export function resolverApi(entorno = ENTORNO) {
  const destinoPedido = (entorno.destino ?? DESTINOS.MOCK).trim().toLowerCase();
  const urlMock = limpiarUrl(entorno.urlMock) || limpiarUrl(entorno.urlLegada);
  const urlTi2 = limpiarUrl(entorno.urlTi2);

  if (destinoPedido === DESTINOS.TI2) {
    const raicesTi2 = paraCadaServicio(
      (servicio) => limpiarUrl(entorno.urlsTi2?.[servicio]) || urlTi2
    );
    const enRespaldo = NOMBRES_SERVICIOS.filter((servicio) => !raicesTi2[servicio]);

    // Basta con que un servicio tenga URL de TI2; los que no, usan el mock.
    if (enRespaldo.length < NOMBRES_SERVICIOS.length) {
      return {
        destino: DESTINOS.TI2,
        raiz: urlTi2 || urlMock,
        raices: paraCadaServicio((servicio) => raicesTi2[servicio] || urlMock),
        serviciosEnRespaldo: enRespaldo,
        respaldo: enRespaldo.length > 0,
      };
    }
  }

  // Se pidió mock, ti2 sin ninguna URL, o un valor desconocido: todo al mock.
  return {
    destino: DESTINOS.MOCK,
    raiz: urlMock,
    raices: paraCadaServicio(() => urlMock),
    serviciosEnRespaldo: destinoPedido === DESTINOS.MOCK ? [] : [...NOMBRES_SERVICIOS],
    respaldo: destinoPedido !== DESTINOS.MOCK,
  };
}

const API = resolverApi();

if (API.respaldo && typeof __DEV__ !== 'undefined' && __DEV__) {
  console.warn(
    `[api] Sin URL de TI2 para: ${API.serviciosEnRespaldo.join(', ')}. ` +
      `Esos servicios usan el mock (${API.raices[API.serviciosEnRespaldo[0]]}).`
  );
}

// Raíz (sin /v1) a la que va una ruta. Las rutas que no son del contrato
// usan la raíz general.
export function raizDeRuta(ruta, api = API) {
  const servicio = servicioDeRuta(ruta);

  return (servicio && api.raices[servicio]) || api.raiz;
}

export const API_DESTINO = API.destino;
export const API_ROOT = API.raiz;
export const API_RAICES = API.raices;
export const API_ES_RESPALDO = API.respaldo;
export const API_SERVICIOS_EN_RESPALDO = API.serviciosEnRespaldo;
