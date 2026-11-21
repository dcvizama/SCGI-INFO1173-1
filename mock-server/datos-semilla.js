// Datos semilla del servidor mock (contrato v1.3.0): un usuario por rol, tres
// activos e incidencias en distintos puntos del ciclo de vida, con su historial,
// sus ordenes de trabajo y sus notificaciones. Son los mismos de los fixtures
// de la app. Se copian aqui porque el mock es un proyecto aparte y temporal.
// Todo vive en memoria: los cambios se pierden cuando Render reinicia el servicio.

const usuarios = [
  {
    id_usuario: '8f14e45f-ce9a-4a1b-9b1f-2d7b5a9c0e11',
    rut_o_id: '11111111-1',
    nombre: 'Ana',
    apellido: 'Rojas',
    correo: 'ana.rojas@uct.cl',
    contrasena: 'Secreta123',
    rol: { id_rol: 1, nombre_rol: 'REPORTANTE' },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
  {
    id_usuario: '3f6c2a1e-8b4d-4c2a-9f1e-2d7b5a9c0e12',
    rut_o_id: '22222222-2',
    nombre: 'Luis',
    apellido: 'Munoz',
    correo: 'luis.munoz@uct.cl',
    contrasena: 'Secreta123',
    rol: { id_rol: 2, nombre_rol: 'SUPERVISOR' },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
  {
    id_usuario: '5a2d9c77-1b3e-4f6a-8c2d-2d7b5a9c0e13',
    rut_o_id: '33333333-3',
    nombre: 'Marta',
    apellido: 'Silva',
    correo: 'marta.silva@uct.cl',
    contrasena: 'Secreta123',
    rol: { id_rol: 3, nombre_rol: 'TECNICO' },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
  {
    id_usuario: 'c7b1e0d4-6a2f-4b8e-9d3c-2d7b5a9c0e14',
    rut_o_id: '44444444-4',
    nombre: 'Pedro',
    apellido: 'Castro',
    correo: 'pedro.castro@uct.cl',
    contrasena: 'Secreta123',
    rol: { id_rol: 4, nombre_rol: 'ADMINISTRADOR' },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
];

const [ANA, LUIS, MARTA] = usuarios.map((u) => u.id_usuario);

const activos = [
  {
    id_activo: 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21',
    codigo_qr: 'UCT-INF-1024',
    nombre: 'Proyector sala 3',
    descripcion: 'Proyector fijo del techo.',
    marca: 'Epson',
    modelo: 'EB-X06',
    numero_serie: 'X6K2210045',
    estado: { id_estado_activo: 1, nombre_estado: 'Operativo' },
    categoria: { id_categoria: 1, nombre_categoria: 'Proyectores' },
    ubicacion: {
      id_ubicacion: 1,
      nombre_espacio: 'Sala 3',
      edificio: { id_edificio: 1, nombre_edificio: 'Edificio A' },
    },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
  {
    id_activo: 'b2e3d4c5-2222-4b3c-8d4e-2d7b5a9c0e22',
    codigo_qr: 'UCT-INF-1025',
    nombre: 'Computador laboratorio 2',
    descripcion: null,
    marca: 'Dell',
    modelo: 'OptiPlex 7010',
    numero_serie: 'DL7010882',
    estado: { id_estado_activo: 2, nombre_estado: 'En mantenimiento' },
    categoria: { id_categoria: 2, nombre_categoria: 'Computadores' },
    ubicacion: {
      id_ubicacion: 2,
      nombre_espacio: 'Laboratorio 2',
      edificio: { id_edificio: 1, nombre_edificio: 'Edificio A' },
    },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
  {
    id_activo: 'c3f4e5d6-3333-4c4d-9e5f-2d7b5a9c0e23',
    codigo_qr: 'UCT-ADM-2048',
    nombre: 'Impresora secretaria',
    descripcion: null,
    marca: 'HP',
    modelo: 'LaserJet M404',
    numero_serie: 'HP404FF12',
    estado: { id_estado_activo: 1, nombre_estado: 'Operativo' },
    categoria: { id_categoria: 3, nombre_categoria: 'Impresoras' },
    ubicacion: {
      id_ubicacion: 3,
      nombre_espacio: 'Secretaria',
      edificio: { id_edificio: 2, nombre_edificio: 'Edificio B' },
    },
    fecha_creacion: '2026-09-01T12:00:00Z',
  },
];

const [PROYECTOR, COMPUTADOR, IMPRESORA] = activos.map((a) => a.id_activo);

// Ciclo de vida de una incidencia (tabla ESTADOS_INCIDENCIA, RF6). Toda
// incidencia nace en el primero.
const estadosIncidencia = [
  { id_estado: 1, nombre_estado: 'Pendiente de revision', orden: 1, es_final: false },
  { id_estado: 2, nombre_estado: 'Clasificada', orden: 2, es_final: false },
  { id_estado: 3, nombre_estado: 'Asignada', orden: 3, es_final: false },
  { id_estado: 4, nombre_estado: 'En diagnostico', orden: 4, es_final: false },
  { id_estado: 5, nombre_estado: 'En reparacion', orden: 5, es_final: false },
  { id_estado: 6, nombre_estado: 'Resuelta', orden: 6, es_final: false },
  { id_estado: 7, nombre_estado: 'Verificada', orden: 7, es_final: false },
  { id_estado: 8, nombre_estado: 'Cerrada', orden: 8, es_final: true },
];

function estado(idEstado) {
  return estadosIncidencia.find((e) => e.id_estado === idEstado);
}

function transicion(origen, destino, rol, requiereComentario = false) {
  return {
    id_estado_origen: origen,
    id_estado_destino: destino,
    roles_permitidos: [rol],
    requiere_comentario: requiereComentario,
  };
}

// Matriz del ciclo de vida (GET /estados-incidencia/transiciones, RF6).
// 1 a 2 se hace con PATCH .../clasificacion y 2 a 3 con POST /ordenes-trabajo.
const transicionesEstado = [
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

// Tipos de evidencia (tabla TIPOS_EVIDENCIA). La app usa el 1 para las fotos.
const tiposEvidencia = [
  { id_tipo_evidencia: 1, nombre_tipo: 'Fotografia' },
  { id_tipo_evidencia: 2, nombre_tipo: 'Documento' },
];

// Historial de estados (tabla HISTORIAL_ESTADOS, RF6). Se arma a partir de los
// pasos de cada incidencia, asi el estado de la incidencia siempre coincide
// con su ultimo registro.
const historialEstados = [];
let numeroHistorial = 0;

function trazar(idIncidencia, pasos) {
  let anterior = null;

  pasos.forEach(([idEstado, idUsuario, comentario, fecha]) => {
    numeroHistorial += 1;
    historialEstados.push({
      id_historial: `9e4f0c2a-${String(numeroHistorial).padStart(4, '0')}-4a10-8b20-2d7b5a9c0e70`,
      id_incidencia: idIncidencia,
      estado_anterior: anterior,
      estado: estado(idEstado),
      id_usuario_cambio: idUsuario,
      comentario,
      fecha_creacion: fecha,
    });
    anterior = estado(idEstado);
  });

  return anterior;
}

// Incidencias de ejemplo, una por punto del ciclo de vida que la demo necesita:
// - Proyector no enciende: Pendiente de revision (bandeja del supervisor).
// - Teclado: Asignada a Marta (el tecnico puede avanzarla).
// - Impresora: Resuelta (el supervisor puede verificarla o rechazarla).
// - Proyector, franjas de color: Cerrada (historial de fallas del proyector).
// Las nuevas se agregan en memoria.
const incidencias = [
  {
    id_incidencia: 'd1a2b3c4-5555-4a6b-8c7d-2d7b5a9c0e31',
    id_activo: PROYECTOR,
    id_reportante: ANA,
    titulo: 'Proyector no enciende',
    descripcion: 'Al presionar el boton de encendido no hay luz ni ventilador.',
    prioridad: 'alta',
    id_tecnico_asignado: null,
    fecha_creacion: '2026-10-20T13:15:00Z',
    pasos: [[1, ANA, null, '2026-10-20T13:15:00Z']],
  },
  {
    id_incidencia: 'e2b3c4d5-6666-4b7c-9d8e-2d7b5a9c0e32',
    id_activo: COMPUTADOR,
    id_reportante: ANA,
    titulo: 'Teclado con teclas pegadas',
    descripcion: 'Las teclas A y S quedan presionadas al escribir.',
    prioridad: 'media',
    id_tecnico_asignado: MARTA,
    fecha_creacion: '2026-10-22T10:40:00Z',
    pasos: [
      [1, ANA, null, '2026-10-22T10:40:00Z'],
      [2, LUIS, 'Afecta un solo puesto del laboratorio.', '2026-10-23T09:00:00Z'],
      [3, LUIS, null, '2026-10-23T09:05:00Z'],
    ],
  },
  {
    id_incidencia: 'f3c4d5e6-7777-4c8d-8e9f-2d7b5a9c0e33',
    id_activo: IMPRESORA,
    id_reportante: LUIS,
    titulo: 'Impresora atasca el papel',
    descripcion: 'Cada tres o cuatro hojas el papel se atasca en la bandeja de salida.',
    prioridad: 'baja',
    id_tecnico_asignado: MARTA,
    fecha_creacion: '2026-10-25T16:05:00Z',
    pasos: [
      [1, LUIS, null, '2026-10-25T16:05:00Z'],
      [2, LUIS, 'Hay otra impresora en el piso.', '2026-10-26T08:30:00Z'],
      [3, LUIS, null, '2026-10-26T08:35:00Z'],
      [4, MARTA, 'Se revisa el rodillo de salida.', '2026-10-27T10:00:00Z'],
      [5, MARTA, 'Rodillo gastado, se cambia.', '2026-10-27T11:30:00Z'],
      [6, MARTA, 'Rodillo nuevo: imprime 50 hojas sin atascos.', '2026-10-29T15:00:00Z'],
    ],
  },
  {
    id_incidencia: 'a5e6f7a8-9999-4eaf-80b1-2d7b5a9c0e34',
    id_activo: PROYECTOR,
    id_reportante: ANA,
    titulo: 'Imagen con franjas de color',
    descripcion: 'La imagen proyectada muestra franjas verdes horizontales.',
    prioridad: 'baja',
    id_tecnico_asignado: MARTA,
    fecha_creacion: '2026-09-15T15:30:00Z',
    pasos: [
      [1, ANA, null, '2026-09-15T15:30:00Z'],
      [2, LUIS, 'Falla intermitente.', '2026-09-16T09:00:00Z'],
      [3, LUIS, null, '2026-09-16T09:10:00Z'],
      [4, MARTA, 'Se revisa el cable VGA.', '2026-09-16T14:00:00Z'],
      [5, MARTA, 'Cable VGA danado, se reemplaza.', '2026-09-17T10:00:00Z'],
      [6, MARTA, 'Cable nuevo: imagen sin franjas.', '2026-09-17T12:00:00Z'],
      [7, LUIS, null, '2026-09-18T10:30:00Z'],
      [8, LUIS, null, '2026-09-18T11:00:00Z'],
    ],
  },
].map(({ pasos, ...incidencia }) => ({
  ...incidencia,
  estado: trazar(incidencia.id_incidencia, pasos),
}));

const [PROYECTOR_NO_ENCIENDE, TECLADO, IMPRESORA_ATASCA, PROYECTOR_FRANJAS] = incidencias.map(
  (i) => i.id_incidencia
);

// Evidencias de ejemplo (RF4), con una imagen real subida a Cloudinary.
const evidencias = [
  {
    id_evidencia: 'a4d5e6f7-8888-4d9e-9f0a-2d7b5a9c0e41',
    id_incidencia: PROYECTOR_NO_ENCIENDE,
    tipo: tiposEvidencia[0],
    url_evidencia:
      'https://res.cloudinary.com/l75ago2l/image/upload/v1793412343/scgi_incidencias/czptumgwsacmqlr5vtfm.png',
    fecha_creacion: '2026-10-20T13:15:10Z',
  },
];

// Ordenes de trabajo (tabla ORDENES_TRABAJO, RF5) de las incidencias asignadas.
const ordenesTrabajo = [
  {
    id_orden: 'c1d2e3f4-aaaa-4b5c-9d6e-2d7b5a9c0e51',
    id_incidencia: TECLADO,
    id_tecnico: MARTA,
    diagnostico_tecnico: null,
    fecha_creacion: '2026-10-23T09:05:00Z',
  },
  {
    id_orden: 'd2e3f4a5-bbbb-4c6d-8e7f-2d7b5a9c0e52',
    id_incidencia: IMPRESORA_ATASCA,
    id_tecnico: MARTA,
    diagnostico_tecnico: 'Rodillo de salida gastado.',
    fecha_creacion: '2026-10-26T08:35:00Z',
  },
  {
    id_orden: 'e3f4a5b6-cccc-4d7e-9f80-2d7b5a9c0e53',
    id_incidencia: PROYECTOR_FRANJAS,
    id_tecnico: MARTA,
    diagnostico_tecnico: 'Cable VGA danado.',
    fecha_creacion: '2026-09-16T09:10:00Z',
  },
];

// Notificaciones (tabla NOTIFICACIONES, RF8): al menos una para cada usuario
// de la demo, la mayoria sin leer.
const notificaciones = [
  {
    id_notificacion: 'f4a5b6c7-dddd-4e8f-a091-2d7b5a9c0e61',
    id_usuario_destino: LUIS,
    id_incidencia: PROYECTOR_NO_ENCIENDE,
    tipo: 'nueva_incidencia',
    titulo: 'Nueva incidencia por revisar',
    mensaje: '"Proyector no enciende" en Sala 3 espera clasificacion.',
    leida: false,
    fecha_creacion: '2026-10-20T13:15:01Z',
    fecha_lectura: null,
  },
  {
    id_notificacion: 'f4a5b6c7-dddd-4e8f-a091-2d7b5a9c0e62',
    id_usuario_destino: MARTA,
    id_incidencia: TECLADO,
    tipo: 'incidencia_asignada',
    titulo: 'Nueva incidencia asignada',
    mensaje: 'Se te asigno "Teclado con teclas pegadas" en Laboratorio 2.',
    leida: false,
    fecha_creacion: '2026-10-23T09:05:01Z',
    fecha_lectura: null,
  },
  {
    id_notificacion: 'f4a5b6c7-dddd-4e8f-a091-2d7b5a9c0e63',
    id_usuario_destino: ANA,
    id_incidencia: TECLADO,
    tipo: 'cambio_estado',
    titulo: 'Tu reporte cambio de estado',
    mensaje: '"Teclado con teclas pegadas" paso a Asignada.',
    leida: false,
    fecha_creacion: '2026-10-23T09:05:01Z',
    fecha_lectura: null,
  },
  {
    id_notificacion: 'f4a5b6c7-dddd-4e8f-a091-2d7b5a9c0e64',
    id_usuario_destino: LUIS,
    id_incidencia: IMPRESORA_ATASCA,
    tipo: 'cambio_estado',
    titulo: 'Tu reporte cambio de estado',
    mensaje: '"Impresora atasca el papel" paso a Resuelta.',
    leida: false,
    fecha_creacion: '2026-10-29T15:00:01Z',
    fecha_lectura: null,
  },
  {
    id_notificacion: 'f4a5b6c7-dddd-4e8f-a091-2d7b5a9c0e65',
    id_usuario_destino: ANA,
    id_incidencia: PROYECTOR_FRANJAS,
    tipo: 'cambio_estado',
    titulo: 'Tu reporte cambio de estado',
    mensaje: '"Imagen con franjas de color" paso a Cerrada.',
    leida: true,
    fecha_creacion: '2026-09-18T11:00:01Z',
    fecha_lectura: '2026-09-18T12:00:00Z',
  },
];

// Dispositivos registrados para push (tabla DISPOSITIVOS, RF8). Empieza vacia:
// la app registra el suyo al iniciar sesion.
const dispositivos = [];

module.exports = {
  usuarios,
  activos,
  estadosIncidencia,
  transicionesEstado,
  tiposEvidencia,
  incidencias,
  historialEstados,
  evidencias,
  ordenesTrabajo,
  notificaciones,
  dispositivos,
};