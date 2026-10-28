import {
  ROLES,
  getTabsPermitidos,
  normalizarRol,
  puedeAcceder,
  puedeReportarIncidencia,
} from '../permissions';

describe('normalizarRol', () => {
  it('acepta el rol tal como viene en el JWT', () => {
    expect(normalizarRol('Supervisor')).toBe(ROLES.SUPERVISOR);
  });

  it('tolera mayúsculas, espacios y tildes', () => {
    expect(normalizarRol('  TECNICO ')).toBe(ROLES.TECNICO);
    expect(normalizarRol('Técnico')).toBe(ROLES.TECNICO);
    expect(normalizarRol('administrador')).toBe(ROLES.ADMINISTRADOR);
  });

  it('devuelve null para un rol desconocido o ausente', () => {
    expect(normalizarRol('Rector')).toBeNull();
    expect(normalizarRol(undefined)).toBeNull();
  });
});

describe('getTabsPermitidos', () => {
  it('da los tres tabs a los roles de terreno', () => {
    [ROLES.REPORTANTE, ROLES.SUPERVISOR, ROLES.TECNICO].forEach((rol) => {
      expect(getTabsPermitidos(rol)).toEqual(['Inicio', 'Escanear', 'Perfil']);
    });
  });

  it('excluye Escanear para el Administrador', () => {
    const tabs = getTabsPermitidos(ROLES.ADMINISTRADOR);

    expect(tabs).toEqual(['Inicio', 'Perfil']);
    expect(tabs).not.toContain('Escanear');
  });

  it('devuelve una lista vacía, nunca undefined, para un rol inválido', () => {
    expect(getTabsPermitidos('Rector')).toEqual([]);
    expect(getTabsPermitidos(null)).toEqual([]);
  });
});

describe('puedeAcceder', () => {
  it('bloquea el escaneo al Administrador y lo permite al Técnico', () => {
    expect(puedeAcceder(ROLES.ADMINISTRADOR, 'Escanear')).toBe(false);
    expect(puedeAcceder(ROLES.TECNICO, 'Escanear')).toBe(true);
  });
});

describe('puedeReportarIncidencia', () => {
  it('permite reportar a los roles de terreno, también con el rol en mayúsculas del contrato', () => {
    expect(puedeReportarIncidencia(ROLES.REPORTANTE)).toBe(true);
    expect(puedeReportarIncidencia('SUPERVISOR')).toBe(true);
    expect(puedeReportarIncidencia('TECNICO')).toBe(true);
  });

  it('no deja reportar al Administrador ni a un rol desconocido', () => {
    expect(puedeReportarIncidencia('ADMINISTRADOR')).toBe(false);
    expect(puedeReportarIncidencia('Rector')).toBe(false);
    expect(puedeReportarIncidencia(undefined)).toBe(false);
  });
});
