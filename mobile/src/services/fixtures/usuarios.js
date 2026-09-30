// Usuarios de prueba, uno por rol, con la forma exacta del esquema Usuario
// del contrato OpenAPI. Se usan en las pruebas y como datos semilla del
// servidor mock de la semana 4.

export const usuarioReportante = {
  id_usuario: '8f14e45f-ce9a-4a1b-9b1f-2d7b5a9c0e11',
  rut_o_id: '11111111-1',
  nombre: 'Ana',
  apellido: 'Rojas',
  correo: 'ana.rojas@uct.cl',
  rol: { id_rol: 1, nombre_rol: 'REPORTANTE' },
  fecha_creacion: '2026-09-01T12:00:00Z',
};

export const usuarioSupervisor = {
  id_usuario: '3f6c2a1e-8b4d-4c2a-9f1e-2d7b5a9c0e12',
  rut_o_id: '22222222-2',
  nombre: 'Luis',
  apellido: 'Munoz',
  correo: 'luis.munoz@uct.cl',
  rol: { id_rol: 2, nombre_rol: 'SUPERVISOR' },
  fecha_creacion: '2026-09-01T12:00:00Z',
};

export const usuarioTecnico = {
  id_usuario: '5a2d9c77-1b3e-4f6a-8c2d-2d7b5a9c0e13',
  rut_o_id: '33333333-3',
  nombre: 'Marta',
  apellido: 'Silva',
  correo: 'marta.silva@uct.cl',
  rol: { id_rol: 3, nombre_rol: 'TECNICO' },
  fecha_creacion: '2026-09-01T12:00:00Z',
};

export const usuarioAdministrador = {
  id_usuario: 'c7b1e0d4-6a2f-4b8e-9d3c-2d7b5a9c0e14',
  rut_o_id: '44444444-4',
  nombre: 'Pedro',
  apellido: 'Castro',
  correo: 'pedro.castro@uct.cl',
  rol: { id_rol: 4, nombre_rol: 'ADMINISTRADOR' },
  fecha_creacion: '2026-09-01T12:00:00Z',
};

export const usuarios = [
  usuarioReportante,
  usuarioSupervisor,
  usuarioTecnico,
  usuarioAdministrador,
];
