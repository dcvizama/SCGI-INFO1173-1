// Activos de prueba con la forma exacta del esquema Activo del contrato.
// Los codigos siguen el formato del QR institucional: UCT-XXX-0000.

export const activoProyector = {
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
};

export const activoComputador = {
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
};

export const activoImpresora = {
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
};

export const activos = [activoProyector, activoComputador, activoImpresora];
