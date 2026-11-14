import { activoProyector } from './activos';
import { usuarioSupervisor, usuarioTecnico } from './usuarios';

// Incidencias de prueba con la forma exacta de los esquemas del contrato v1.3.0.

export const ID_TIPO_FOTOGRAFIA = 1;

// Catálogo ESTADOS_INCIDENCIA: ciclo de vida de 8 estados (RF6).
// Respuesta de GET /estados-incidencia.
export const estadosIncidencia = [
  { id_estado: 1, nombre_estado: 'Pendiente de revision', orden: 1, es_final: false },
  { id_estado: 2, nombre_estado: 'Clasificada', orden: 2, es_final: false },
  { id_estado: 3, nombre_estado: 'Asignada', orden: 3, es_final: false },
  { id_estado: 4, nombre_estado: 'En diagnostico', orden: 4, es_final: false },
  { id_estado: 5, nombre_estado: 'En reparacion', orden: 5, es_final: false },
  { id_estado: 6, nombre_estado: 'Resuelta', orden: 6, es_final: false },
  { id_estado: 7, nombre_estado: 'Verificada', orden: 7, es_final: false },
  { id_estado: 8, nombre_estado: 'Cerrada', orden: 8, es_final: true },
];

export const [
  estadoPendiente,
  estadoClasificada,
  estadoAsignada,
  estadoEnDiagnostico,
  estadoEnReparacion,
  estadoResuelta,
] = estadosIncidencia;

function transicion(origen, destino, rol, requiereComentario = false) {
  return {
    id_estado_origen: origen,
    id_estado_destino: destino,
    roles_permitidos: [rol],
    requiere_comentario: requiereComentario,
  };
}

// Respuesta de GET /estados-incidencia/transiciones (TransicionEstado[]).
// Misma matriz que la descripción de esa ruta en el contrato.
export const transicionesEstado = [
  transicion(1, 2, 'SUPERVISOR'),
  transicion(1, 8, 'SUPERVISOR', true),
  transicion(2, 3, 'SUPERVISOR'),
  transicion(3, 4, 'TECNICO'),
  transicion(4, 5, 'TECNICO'),
  transicion(5, 6, 'TECNICO', true),
  transicion(6, 7, 'SUPERVISOR'),
  transicion(6, 5, 'SUPERVISOR', true),
  transicion(7, 8, 'SUPERVISOR'),
];

export const tipoFotografia = { id_tipo_evidencia: ID_TIPO_FOTOGRAFIA, nombre_tipo: 'Fotografia' };

// Cuerpo de POST /incidencias (NuevaIncidencia).
export const nuevaIncidenciaProyector = {
  id_activo: activoProyector.id_activo,
  titulo: 'Proyector no enciende',
  descripcion: 'Al presionar el boton de encendido no hay luz ni ventilador.',
  prioridad: 'alta',
};

// Respuesta 201 de POST /incidencias (Incidencia).
export const incidenciaProyector = {
  id_incidencia: 'c3f4e5d6-3333-4c4d-9e5f-2d7b5a9c0e31',
  id_activo: activoProyector.id_activo,
  id_reportante: 'd4a5b6c7-4444-4d5e-8f60-2d7b5a9c0e41',
  titulo: nuevaIncidenciaProyector.titulo,
  descripcion: nuevaIncidenciaProyector.descripcion,
  prioridad: 'alta',
  estado: estadoPendiente,
  id_tecnico_asignado: null,
  fecha_creacion: '2026-10-31T12:00:00Z',
};

// La misma incidencia en cada paso del ciclo de vida (RF5, RF6).
export const incidenciaClasificada = {
  ...incidenciaProyector,
  prioridad: 'media',
  estado: estadoClasificada,
};

export const incidenciaAsignada = {
  ...incidenciaClasificada,
  estado: estadoAsignada,
  id_tecnico_asignado: usuarioTecnico.id_usuario,
};

export const incidenciaEnDiagnostico = {
  ...incidenciaAsignada,
  estado: estadoEnDiagnostico,
};

// Respuesta 201 de POST /ordenes-trabajo (OrdenTrabajo).
export const ordenProyector = {
  id_orden: 'f6c7d8e9-6666-4f70-8182-2d7b5a9c0e61',
  id_incidencia: incidenciaProyector.id_incidencia,
  id_tecnico: usuarioTecnico.id_usuario,
  diagnostico_tecnico: null,
  fecha_creacion: '2026-11-02T10:05:00Z',
};

// Respuesta de GET /incidencias/{id_incidencia}/historial (HistorialEstado[]),
// del cambio más antiguo al más reciente.
export const historialProyector = [
  {
    id_historial: 'a7d8e9f0-7777-4a81-9293-2d7b5a9c0e71',
    id_incidencia: incidenciaProyector.id_incidencia,
    estado_anterior: null,
    estado: estadoPendiente,
    id_usuario_cambio: incidenciaProyector.id_reportante,
    comentario: null,
    fecha_creacion: '2026-10-31T12:00:00Z',
  },
  {
    id_historial: 'b8e9f0a1-8888-4b92-a3a4-2d7b5a9c0e72',
    id_incidencia: incidenciaProyector.id_incidencia,
    estado_anterior: estadoPendiente,
    estado: estadoClasificada,
    id_usuario_cambio: usuarioSupervisor.id_usuario,
    comentario: 'Hay sala de respaldo, se baja a prioridad media.',
    fecha_creacion: '2026-11-02T10:00:00Z',
  },
  {
    id_historial: 'c9f0a1b2-9999-4ca3-b4b5-2d7b5a9c0e73',
    id_incidencia: incidenciaProyector.id_incidencia,
    estado_anterior: estadoClasificada,
    estado: estadoAsignada,
    id_usuario_cambio: usuarioSupervisor.id_usuario,
    comentario: null,
    fecha_creacion: '2026-11-02T10:05:00Z',
  },
  {
    id_historial: 'd0a1b2c3-aaaa-4db4-85c6-2d7b5a9c0e74',
    id_incidencia: incidenciaProyector.id_incidencia,
    estado_anterior: estadoAsignada,
    estado: estadoEnDiagnostico,
    id_usuario_cambio: usuarioTecnico.id_usuario,
    comentario: 'Se revisa la fuente de poder.',
    fecha_creacion: '2026-11-03T09:00:00Z',
  },
];

// Respuesta 201 de POST /incidencias/{id_incidencia}/evidencias (Evidencia).
export const evidenciaProyector = {
  id_evidencia: 'e5b6c7d8-5555-4e6f-9071-2d7b5a9c0e51',
  id_incidencia: incidenciaProyector.id_incidencia,
  tipo: tipoFotografia,
  url_evidencia:
    'https://res.cloudinary.com/l75ago2l/image/upload/v1/scgi_incidencias/proyector1.jpg',
  fecha_creacion: '2026-10-31T12:00:05Z',
};