// Datos de prueba de la bandeja y la trazabilidad, con la forma de los esquemas
// Incidencia e HistorialEstado del contrato OpenAPI v1.3.0 (docs/api/openapi.yaml).
// Viven aquí y no en services/fixtures para que las pruebas del contexto no
// dependan de los archivos de servicios.

// Catálogo ESTADOS_INCIDENCIA (RF6).
export const ESTADO = {
  PENDIENTE: { id_estado: 1, nombre_estado: 'Pendiente de revision', orden: 1, es_final: false },
  CLASIFICADA: { id_estado: 2, nombre_estado: 'Clasificada', orden: 2, es_final: false },
  ASIGNADA: { id_estado: 3, nombre_estado: 'Asignada', orden: 3, es_final: false },
  EN_DIAGNOSTICO: { id_estado: 4, nombre_estado: 'En diagnostico', orden: 4, es_final: false },
  EN_REPARACION: { id_estado: 5, nombre_estado: 'En reparacion', orden: 5, es_final: false },
  RESUELTA: { id_estado: 6, nombre_estado: 'Resuelta', orden: 6, es_final: false },
  VERIFICADA: { id_estado: 7, nombre_estado: 'Verificada', orden: 7, es_final: false },
  CERRADA: { id_estado: 8, nombre_estado: 'Cerrada', orden: 8, es_final: true },
};

// Matriz del ciclo de vida (GET /estados-incidencia/transiciones, esquema
// TransicionEstado), copiada de la descripción de esa ruta en el contrato.
function transicion(origen, destino, rol, requiereComentario = false) {
  return {
    id_estado_origen: origen,
    id_estado_destino: destino,
    roles_permitidos: [rol],
    requiere_comentario: requiereComentario,
  };
}

export const transicionesContrato = [
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

const ID_REPORTANTE = 'd4a5b6c7-4444-4d5e-8f60-2d7b5a9c0e41';
const ID_SUPERVISOR = 'b2c3d4e5-2222-4b3c-8d4e-2d7b5a9c0e22';
const ID_TECNICO = 'c3d4e5f6-3333-4c4d-9e5f-2d7b5a9c0e23';

export const ticketPendiente = {
  id_incidencia: 'c3f4e5d6-3333-4c4d-9e5f-2d7b5a9c0e31',
  id_activo: 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21',
  id_reportante: ID_REPORTANTE,
  titulo: 'Proyector no enciende',
  descripcion: 'Al presionar el boton de encendido no hay luz ni ventilador.',
  prioridad: 'alta',
  estado: ESTADO.PENDIENTE,
  id_tecnico_asignado: null,
  fecha_creacion: '2026-10-31T12:00:00Z',
};

export const ticketClasificado = {
  ...ticketPendiente,
  prioridad: 'media',
  estado: ESTADO.CLASIFICADA,
};

export const ticketAsignado = {
  ...ticketClasificado,
  estado: ESTADO.ASIGNADA,
  id_tecnico_asignado: ID_TECNICO,
};

export const ticketEnDiagnostico = { ...ticketAsignado, estado: ESTADO.EN_DIAGNOSTICO };

// Otra incidencia, para probar respuestas que llegan fuera de orden.
export const otroTicket = {
  ...ticketPendiente,
  id_incidencia: 'f0e1d2c3-bbbb-4c5d-8e9f-2d7b5a9c0e99',
  titulo: 'Impresora atasca el papel',
};

// GET /incidencias/{id_incidencia}/historial, del cambio más antiguo al más reciente.
export const historialTicket = [
  {
    id_historial: 'a7d8e9f0-7777-4a81-9293-2d7b5a9c0e71',
    id_incidencia: ticketPendiente.id_incidencia,
    estado_anterior: null,
    estado: ESTADO.PENDIENTE,
    id_usuario_cambio: ID_REPORTANTE,
    comentario: null,
    fecha_creacion: '2026-10-31T12:00:00Z',
  },
  {
    id_historial: 'b8e9f0a1-8888-4b92-a3a4-2d7b5a9c0e72',
    id_incidencia: ticketPendiente.id_incidencia,
    estado_anterior: ESTADO.PENDIENTE,
    estado: ESTADO.CLASIFICADA,
    id_usuario_cambio: ID_SUPERVISOR,
    comentario: 'Hay sala de respaldo, se baja a prioridad media.',
    fecha_creacion: '2026-11-02T10:00:00Z',
  },
];

// Historial después de asignar: el cambio agrega un registro al final.
export const historialAsignado = [
  ...historialTicket,
  {
    id_historial: 'c9f0a1b2-9999-4ca3-b4b5-2d7b5a9c0e73',
    id_incidencia: ticketPendiente.id_incidencia,
    estado_anterior: ESTADO.CLASIFICADA,
    estado: ESTADO.ASIGNADA,
    id_usuario_cambio: ID_SUPERVISOR,
    comentario: null,
    fecha_creacion: '2026-11-02T10:05:00Z',
  },
];

// GET /usuarios?rol=TECNICO (esquema Usuario).
export const tecnico = {
  id_usuario: ID_TECNICO,
  rut_o_id: '33333333-3',
  nombre: 'Marta',
  apellido: 'Silva',
  correo: 'marta.silva@uct.cl',
  rol: { id_rol: 3, nombre_rol: 'TECNICO' },
  fecha_creacion: '2026-09-01T12:00:00Z',
};

// POST /ordenes-trabajo (esquema OrdenTrabajo).
export const ordenTrabajo = {
  id_orden: 'f6c7d8e9-6666-4f70-8182-2d7b5a9c0e61',
  id_incidencia: ticketPendiente.id_incidencia,
  id_tecnico: ID_TECNICO,
  diagnostico_tecnico: null,
  fecha_creacion: '2026-11-02T10:05:00Z',
};
