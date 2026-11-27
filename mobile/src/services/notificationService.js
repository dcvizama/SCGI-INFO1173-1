import { Platform } from 'react-native';

import { ApiError, del, get, patch, post } from '../api/client';

// Servicio de notificaciones (RF8). Usa las rutas del contrato OpenAPI v1.3.0.
// Todas las peticiones pasan por client.js, que agrega el token JWT (RNF4),
// exige HTTPS (RNF3) y cierra la sesión si la API responde 401: este archivo
// no repite nada de eso.
// Las notificaciones las crea el backend ante los eventos del ciclo de vida.
// La app solo las consulta, las marca como leídas y registra el dispositivo
// para recibir la push.

// Valores de TipoNotificacion del contrato.
export const TIPOS_NOTIFICACION = Object.freeze({
  NUEVA_INCIDENCIA: 'nueva_incidencia',
  INCIDENCIA_ASIGNADA: 'incidencia_asignada',
  CAMBIO_ESTADO: 'cambio_estado',
});

const PLATAFORMAS = ['android', 'ios'];
const FORMATO_TOKEN_EXPO = /^Expo(nent)?PushToken\[.+\]$/;

// Dispositivo registrado en esta sesión. Se guarda para darlo de baja al cerrar sesión.
let dispositivoActual = null;

function errorDeDatos(mensaje) {
  return new ApiError({ mensaje, tipo: 'datos' });
}

// GET /notificaciones del usuario del token, de la más reciente a la más antigua.
// filtros: { leida, limite }. Con leida: false trae solo las no leídas.
// Siempre devuelve un arreglo, para que la pantalla muestre el estado vacío.
export async function listarNotificaciones(filtros = {}) {
  const { leida, limite } = filtros;

  const lista = await get('/notificaciones', { params: { leida, limite } });

  return Array.isArray(lista) ? lista : [];
}

// Cantidad de no leídas de una lista ya cargada (distintivo del ícono).
export function contarNoLeidas(notificaciones) {
  return (notificaciones ?? []).filter((notificacion) => !notificacion.leida).length;
}

// PATCH /notificaciones/{id_notificacion}/leida. No lleva cuerpo.
// Devuelve la Notificacion con leida: true y su fecha_lectura.
export async function marcarNotificacionLeida(idNotificacion) {
  if (!idNotificacion) throw errorDeDatos('Falta la notificación a marcar como leída.');

  return patch(`/notificaciones/${encodeURIComponent(idNotificacion)}/leida`);
}

// POST /dispositivos (RF8, RNF6). Se llama después de iniciar sesión, con el
// token que entrega expo-notifications (getExpoPushTokenAsync).
// La API responde 201 si es nuevo y 200 si ya existía: en ambos casos
// devuelve el Dispositivo, que queda guardado para la baja.
export async function registrarDispositivo(tokenExpo, plataforma = Platform.OS) {
  if (!FORMATO_TOKEN_EXPO.test(tokenExpo ?? '')) {
    throw errorDeDatos('El token de notificaciones del dispositivo no es válido.');
  }
  if (!PLATAFORMAS.includes(plataforma)) {
    throw errorDeDatos('Las notificaciones push solo funcionan en Android e iOS.');
  }

  const dispositivo = await post('/dispositivos', { token_expo: tokenExpo, plataforma });
  dispositivoActual = dispositivo;

  return dispositivo;
}

// Dispositivo registrado en esta sesión, o null si no hay.
export function obtenerDispositivoActual() {
  return dispositivoActual;
}

// Olvida el dispositivo sin llamar a la API. Se usa en las pruebas.
export function olvidarDispositivo() {
  dispositivoActual = null;
}

// DELETE /dispositivos/{id_dispositivo}. Se llama al cerrar sesión, antes de
// borrar el token, para que el teléfono deje de recibir push.
// - Nunca lanza: el cierre de sesión no puede quedar bloqueado por la red.
//   Devuelve true si el dispositivo quedó dado de baja o ya no existía (404).
// - Olvida el dispositivo antes de la petición: si la API responde 401,
//   client.js vuelve a llamar al cierre de sesión y esa segunda llamada no
//   hace nada.
export async function darDeBajaDispositivo() {
  const dispositivo = dispositivoActual;
  dispositivoActual = null;

  if (!dispositivo) return true;

  try {
    await del(`/dispositivos/${encodeURIComponent(dispositivo.id_dispositivo)}`);
    return true;
  } catch (error) {
    return error?.status === 404;
  }
}

// Lee el campo data de una push de Expo (CargaNotificacionPush). Acepta:
// - la respuesta del listener al pulsar (response.notification.request.content.data),
// - la notificación recibida (notification.request.content.data),
// - o directamente el objeto data.
// Devuelve { id_notificacion, id_incidencia, tipo } o null si no es una
// notificación del SCGI. El listener usa id_incidencia para abrir el ticket.
export function leerCargaPush(entrada) {
  const data =
    entrada?.notification?.request?.content?.data ?? entrada?.request?.content?.data ?? entrada;

  const tipoValido = Object.values(TIPOS_NOTIFICACION).includes(data?.tipo);
  if (!data?.id_notificacion || !tipoValido) return null;

  return {
    id_notificacion: data.id_notificacion,
    id_incidencia: data.id_incidencia ?? null,
    tipo: data.tipo,
  };
}
