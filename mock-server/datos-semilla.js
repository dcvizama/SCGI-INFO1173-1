// Datos semilla del servidor mock: un usuario por rol y tres activos.
// Son los mismos de los fixtures de la app. Se copian aqui porque el mock es
// un proyecto aparte y temporal.

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

// Ciclo de vida de una incidencia (tabla ESTADOS_INCIDENCIA). Toda incidencia
// nace en el primero. Los cambios de estado son del Sprint 3 (RF5, RF6).
const estadosIncidencia = [
  { id_estado: 1, nombre_estado: 'Pendiente' },
  { id_estado: 2, nombre_estado: 'Clasificada' },
  { id_estado: 3, nombre_estado: 'Asignada' },
  { id_estado: 4, nombre_estado: 'En diagnostico' },
  { id_estado: 5, nombre_estado: 'En reparacion' },
  { id_estado: 6, nombre_estado: 'Resuelta' },
  { id_estado: 7, nombre_estado: 'Verificada' },
  { id_estado: 8, nombre_estado: 'Cerrada' },
];

// Tipos de evidencia (tabla TIPOS_EVIDENCIA). La app usa el 1 para las fotos.
const tiposEvidencia = [
  { id_tipo_evidencia: 1, nombre_tipo: 'Fotografia' },
  { id_tipo_evidencia: 2, nombre_tipo: 'Documento' },
];

// Incidencias de ejemplo (RF3). Las nuevas se agregan en memoria y se pierden
// cuando Render reinicia el servicio.
const incidencias = [
  {
    id_incidencia: 'd1a2b3c4-5555-4a6b-8c7d-2d7b5a9c0e31',
    id_activo: 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21',
    id_reportante: '8f14e45f-ce9a-4a1b-9b1f-2d7b5a9c0e11',
    titulo: 'Proyector no enciende',
    descripcion: 'Al presionar el boton de encendido no hay luz ni ventilador.',
    prioridad: 'alta',
    estado: estadosIncidencia[0],
    fecha_creacion: '2026-10-20T13:15:00Z',
  },
  {
    id_incidencia: 'e2b3c4d5-6666-4b7c-9d8e-2d7b5a9c0e32',
    id_activo: 'b2e3d4c5-2222-4b3c-8d4e-2d7b5a9c0e22',
    id_reportante: '8f14e45f-ce9a-4a1b-9b1f-2d7b5a9c0e11',
    titulo: 'Teclado con teclas pegadas',
    descripcion: 'Las teclas A y S quedan presionadas al escribir.',
    prioridad: 'media',
    estado: estadosIncidencia[0],
    fecha_creacion: '2026-10-22T10:40:00Z',
  },
  {
    id_incidencia: 'f3c4d5e6-7777-4c8d-8e9f-2d7b5a9c0e33',
    id_activo: 'c3f4e5d6-3333-4c4d-9e5f-2d7b5a9c0e23',
    id_reportante: '3f6c2a1e-8b4d-4c2a-9f1e-2d7b5a9c0e12',
    titulo: 'Impresora atasca el papel',
    descripcion: 'Cada tres o cuatro hojas el papel se atasca en la bandeja de salida.',
    prioridad: 'baja',
    estado: estadosIncidencia[0],
    fecha_creacion: '2026-10-25T16:05:00Z',
  },
];

// Evidencias de ejemplo (RF4), con una imagen real subida a Cloudinary.
const evidencias = [
  {
    id_evidencia: 'a4d5e6f7-8888-4d9e-9f0a-2d7b5a9c0e41',
    id_incidencia: 'd1a2b3c4-5555-4a6b-8c7d-2d7b5a9c0e31',
    tipo: tiposEvidencia[0],
    url_evidencia:
      'https://res.cloudinary.com/l75ago2l/image/upload/v1793412343/scgi_incidencias/czptumgwsacmqlr5vtfm.png',
    fecha_creacion: '2026-10-20T13:15:10Z',
  },
];

module.exports = {
  usuarios,
  activos,
  estadosIncidencia,
  tiposEvidencia,
  incidencias,
  evidencias,
};