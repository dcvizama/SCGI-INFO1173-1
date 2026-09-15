export function decodeToken(token) {
  if (typeof token !== 'string') return null;

  const partes = token.split('.');
  if (partes.length !== 3) return null;

  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(relleno));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const datos = decodeToken(token);
  if (!datos || !datos.exp) return true;
  return datos.exp * 1000 <= Date.now();
}
