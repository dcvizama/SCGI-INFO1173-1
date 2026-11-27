export const ROLES = {
  REPORTANTE: 'Reportante',
  SUPERVISOR: 'Supervisor',
  TECNICO: 'Tecnico',
  ADMINISTRADOR: 'Administrador',
};

// La Bandeja reúne las incidencias de cada rol de terreno: el Reportante sigue
// sus reportes (trazabilidad), el Supervisor clasifica y asigna, y el Técnico
// avanza las que tiene asignadas (RF5, RF6). Qué incidencias ve cada uno lo
// decide la pantalla con sus filtros y el backend con el token.
// Notificaciones (RF8) va con la Bandeja: cada aviso abre el seguimiento.
const TABS_POR_ROL = {
  [ROLES.REPORTANTE]: ['Inicio', 'Escanear', 'Bandeja', 'Notificaciones', 'Perfil'],
  [ROLES.SUPERVISOR]: ['Inicio', 'Escanear', 'Bandeja', 'Notificaciones', 'Perfil'],
  [ROLES.TECNICO]: ['Inicio', 'Escanear', 'Bandeja', 'Notificaciones', 'Perfil'],
  [ROLES.ADMINISTRADOR]: ['Inicio', 'Perfil'],
};

// RF3: roles que reportan incidencias desde la ficha del activo.
// El Administrador no tiene el escáner, así que tampoco reporta en terreno.
const ROLES_QUE_REPORTAN = [ROLES.REPORTANTE, ROLES.SUPERVISOR, ROLES.TECNICO];

function sinAcentos(texto) {
  return texto
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u');
}

export function normalizarRol(rol) {
  if (typeof rol !== 'string') return null;

  const limpio = sinAcentos(rol.trim().toLowerCase());
  const conocido = Object.values(ROLES).find((valor) => valor.toLowerCase() === limpio);

  return conocido || null;
}

export function getTabsPermitidos(rol) {
  const normalizado = normalizarRol(rol);
  if (!normalizado) return [];
  return TABS_POR_ROL[normalizado] ?? [];
}

export function puedeAcceder(rol, tab) {
  return getTabsPermitidos(rol).includes(tab);
}

export function puedeReportarIncidencia(rol) {
  return ROLES_QUE_REPORTAN.includes(normalizarRol(rol));
}

// RF5, RF6: roles con bandeja de incidencias y seguimiento de cada una.
export function puedeVerBandeja(rol) {
  return puedeAcceder(rol, 'Bandeja');
}
