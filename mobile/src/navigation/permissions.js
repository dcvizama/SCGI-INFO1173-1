export const ROLES = {
  REPORTANTE: 'Reportante',
  SUPERVISOR: 'Supervisor',
  TECNICO: 'Tecnico',
  ADMINISTRADOR: 'Administrador',
};

const TABS_POR_ROL = {
  [ROLES.REPORTANTE]: ['Inicio', 'Escanear', 'Perfil'],
  [ROLES.SUPERVISOR]: ['Inicio', 'Escanear', 'Perfil'],
  [ROLES.TECNICO]: ['Inicio', 'Escanear', 'Perfil'],
  [ROLES.ADMINISTRADOR]: ['Inicio', 'Perfil'],
};

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
  return normalizado ? TABS_POR_ROL[normalizado] : [];
}

export function puedeAcceder(rol, tab) {
  return getTabsPermitidos(rol).includes(tab);
}
