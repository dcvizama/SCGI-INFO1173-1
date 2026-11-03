import { activoProyector } from './activos';

// Incidencias de prueba con la forma exacta de los esquemas del contrato v1.2.0.

export const ID_TIPO_FOTOGRAFIA = 1;

export const estadoPendiente = { id_estado: 1, nombre_estado: 'Pendiente' };

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
  fecha_creacion: '2026-10-31T12:00:00Z',
};

// Respuesta 201 de POST /incidencias/{id_incidencia}/evidencias (Evidencia).
export const evidenciaProyector = {
  id_evidencia: 'e5b6c7d8-5555-4e6f-9071-2d7b5a9c0e51',
  id_incidencia: incidenciaProyector.id_incidencia,
  tipo: tipoFotografia,
  url_evidencia:
    'https://res.cloudinary.com/l75ago2l/image/upload/v1/scgi_incidencias/proyector1.jpg',
  fecha_creacion: '2026-10-31T12:00:05Z',
};