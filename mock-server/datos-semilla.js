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

module.exports = { usuarios, activos };