import { incidenciaAsignada, incidenciaProyector } from './incidencias';
import { usuarioReportante, usuarioTecnico } from './usuarios';

// Notificaciones de prueba con la forma exacta de los esquemas del contrato v1.3.0 (RF8).

export const tokenExpo = 'ExponentPushToken[xk3sVq9LmP2aT7bWc1Zr8E]';

// Cuerpo de POST /dispositivos (NuevoDispositivo).
export const nuevoDispositivo = { token_expo: tokenExpo, plataforma: 'android' };

// Respuesta 201 de POST /dispositivos (Dispositivo).
export const dispositivoTecnico = {
  id_dispositivo: 'f1a2b3c4-cccc-4d5e-a6f7-2d7b5a9c0e81',
  id_usuario: usuarioTecnico.id_usuario,
  token_expo: tokenExpo,
  plataforma: 'android',
  fecha_creacion: '2026-11-02T09:00:00Z',
};

// Aviso al técnico cuando el supervisor le asigna la incidencia (sin leer).
export const notificacionAsignada = {
  id_notificacion: 'a2b3c4d5-dddd-4e6f-b7a8-2d7b5a9c0e82',
  id_usuario_destino: usuarioTecnico.id_usuario,
  id_incidencia: incidenciaAsignada.id_incidencia,
  tipo: 'incidencia_asignada',
  titulo: 'Nueva incidencia asignada',
  mensaje: 'Se te asignó "Proyector no enciende" en Sala 3.',
  leida: false,
  fecha_creacion: '2026-11-02T10:05:01Z',
  fecha_lectura: null,
};

// La misma notificación después de marcarla como leída.
export const notificacionAsignadaLeida = {
  ...notificacionAsignada,
  leida: true,
  fecha_lectura: '2026-11-02T10:20:00Z',
};

// Aviso al reportante cuando su incidencia cambia de estado (ya leída).
export const notificacionCambioEstado = {
  id_notificacion: 'b3c4d5e6-eeee-4f70-88b9-2d7b5a9c0e83',
  id_usuario_destino: usuarioReportante.id_usuario,
  id_incidencia: incidenciaProyector.id_incidencia,
  tipo: 'cambio_estado',
  titulo: 'Tu reporte cambió de estado',
  mensaje: '"Proyector no enciende" pasó a En diagnostico.',
  leida: true,
  fecha_creacion: '2026-11-03T09:00:01Z',
  fecha_lectura: '2026-11-03T09:30:00Z',
};

// Respuesta de GET /notificaciones (de la más reciente a la más antigua).
export const notificaciones = [notificacionCambioEstado, notificacionAsignada];

// Campo data de la push que llega por Expo (CargaNotificacionPush).
export const cargaPushAsignada = {
  id_notificacion: notificacionAsignada.id_notificacion,
  id_incidencia: notificacionAsignada.id_incidencia,
  tipo: notificacionAsignada.tipo,
};
