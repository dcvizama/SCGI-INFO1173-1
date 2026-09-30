import { ApiError, get, post } from '../api/client';

// Funciones de sesion contra el servicio de autenticacion (RF1).
// Las rutas son las del contrato OpenAPI v1.1.0.

export async function iniciarSesion(correo, contrasena) {
  const sesion = await post(
    '/autenticacion/inicio-sesion',
    { correo, contrasena },
    { sinSesion: true }
  );

  if (!sesion?.token || !sesion?.usuario) {
    throw new ApiError({
      mensaje: 'La respuesta del servidor no trae la sesion completa.',
      tipo: 'http',
    });
  }

  return sesion;
}

export function obtenerUsuarioActual() {
  return get('/autenticacion/usuario-actual');
}
