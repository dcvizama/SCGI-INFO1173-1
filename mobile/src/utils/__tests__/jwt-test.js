import { decodeToken, isTokenExpired } from '../jwt';

const TOKEN_VIGENTE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDBhNDc1OC1kNTE1LTVjNTMtOTQzYy01ODEyNDkxYmI1ODgiLCJub21icmUiOiJCcnVubyIsImFwZWxsaWRvIjoiU290byIsImNvcnJlbyI6InN1cGVydmlzb3JAdWN0LmNsIiwicm9sIjoiU3VwZXJ2aXNvciIsImV4cCI6MTg5MzQ1NjAwMH0.mock-signature-no-verificada';

const TOKEN_EXPIRADO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDBhNDc1OC1kNTE1LTVjNTMtOTQzYy01ODEyNDkxYmI1ODgiLCJub21icmUiOiJCcnVubyIsImFwZWxsaWRvIjoiU290byIsImNvcnJlbyI6InN1cGVydmlzb3JAdWN0LmNsIiwicm9sIjoiU3VwZXJ2aXNvciIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature-no-verificada';

describe('decodeToken', () => {
  it('extrae el payload de un JWT válido', () => {
    const datos = decodeToken(TOKEN_VIGENTE);

    expect(datos.rol).toBe('Supervisor');
    expect(datos.correo).toBe('supervisor@uct.cl');
    expect(datos.sub).toBeDefined();
  });

  it('devuelve null si el token no tiene tres partes', () => {
    expect(decodeToken('abc.def')).toBeNull();
    expect(decodeToken('sin-puntos')).toBeNull();
  });

  it('devuelve null si el valor no es un string', () => {
    expect(decodeToken(null)).toBeNull();
    expect(decodeToken(undefined)).toBeNull();
    expect(decodeToken(12345)).toBeNull();
  });

  it('devuelve null si el payload no es JSON válido', () => {
    expect(decodeToken('header.$$$$.firma')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('reconoce un token vigente', () => {
    expect(isTokenExpired(TOKEN_VIGENTE)).toBe(false);
  });

  it('reconoce un token vencido', () => {
    expect(isTokenExpired(TOKEN_EXPIRADO)).toBe(true);
  });

  it('trata como expirado cualquier token que no pueda leer', () => {
    expect(isTokenExpired('roto')).toBe(true);
    expect(isTokenExpired(null)).toBe(true);
  });
});
