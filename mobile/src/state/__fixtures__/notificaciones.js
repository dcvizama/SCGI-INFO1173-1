// Notificaciones de prueba con la forma del esquema Notificacion del contrato
// OpenAPI v1.3.0 (RF8), de la más reciente a la más antigua.

const ID_INCIDENCIA = 'c3f4e5d6-3333-4c4d-9e5f-2d7b5a9c0e31';

// Aviso al técnico cuando le asignan una incidencia (sin leer).
export const notificacionAsignada = {
  id_notificacion: 'a2b3c4d5-dddd-4e6f-b7a8-2d7b5a9c0e82',
  id_usuario_destino: 'c3d4e5f6-3333-4c4d-9e5f-2d7b5a9c0e23',
  id_incidencia: ID_INCIDENCIA,
  tipo: 'incidencia_asignada',
  titulo: 'Nueva incidencia asignada',
  mensaje: 'Se te asignó "Proyector no enciende" en Sala 3.',
  leida: false,
  fecha_creacion: '2026-11-02T10:05:01Z',
  fecha_lectura: null,
};

export const notificacionAsignadaLeida = {
  ...notificacionAsignada,
  leida: true,
  fecha_lectura: '2026-11-02T10:20:00Z',
};

// Aviso de cambio de estado (ya leída).
export const notificacionCambioEstado = {
  id_notificacion: 'b3c4d5e6-eeee-4f70-88b9-2d7b5a9c0e83',
  id_usuario_destino: 'd4a5b6c7-4444-4d5e-8f60-2d7b5a9c0e41',
  id_incidencia: ID_INCIDENCIA,
  tipo: 'cambio_estado',
  titulo: 'Tu reporte cambió de estado',
  mensaje: '"Proyector no enciende" pasó a En diagnostico.',
  leida: true,
  fecha_creacion: '2026-11-01T09:00:01Z',
  fecha_lectura: '2026-11-01T09:30:00Z',
};

// Una que llega por push y todavía no está en la lista.
export const notificacionNueva = {
  ...notificacionAsignada,
  id_notificacion: 'c4d5e6f7-ffff-4a81-99c0-2d7b5a9c0e84',
  tipo: 'cambio_estado',
  titulo: 'Tu reporte cambió de estado',
  fecha_creacion: '2026-11-03T08:00:00Z',
};

// Campo data de la push que llega por Expo (CargaNotificacionPush).
export function cargaPush(notificacion) {
  return {
    id_notificacion: notificacion.id_notificacion,
    id_incidencia: notificacion.id_incidencia,
    tipo: notificacion.tipo,
  };
}
