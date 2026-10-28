import { iniciarSesion, obtenerUsuarioActual } from '../authService';
import { get, post, ApiError } from '../../api/client';
import { decodeToken } from '../../utils/jwt';
import { sesionTecnico, contrasenaValida } from '../fixtures/sesiones';
import { usuarioTecnico } from '../fixtures/usuarios';

jest.mock('../../api/client', () => {
  const real = jest.requireActual('../../api/client');

  return {
    ApiError: real.ApiError,
    get: jest.fn(),
    post: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authService', () => {
  it('inicia sesion contra la ruta del contrato y sin token', async () => {
    post.mockResolvedValue(sesionTecnico);

    const sesion = await iniciarSesion(usuarioTecnico.correo, contrasenaValida);

    expect(post).toHaveBeenCalledWith(
      '/autenticacion/inicio-sesion',
      { correo: usuarioTecnico.correo, contrasena: contrasenaValida },
      { sinSesion: true }
    );
    expect(sesion).toEqual(sesionTecnico);
  });

  it('el token de la sesion trae el rol del usuario', async () => {
    post.mockResolvedValue(sesionTecnico);

    const sesion = await iniciarSesion(usuarioTecnico.correo, contrasenaValida);
    const contenido = decodeToken(sesion.token);

    expect(contenido.rol).toBe('TECNICO');
    expect(contenido.sub).toBe(usuarioTecnico.id_usuario);
  });

  it('avisa si la respuesta viene incompleta', async () => {
    post.mockResolvedValue({ token: 'solo-token' });

    await expect(iniciarSesion('ana.rojas@uct.cl', contrasenaValida)).rejects.toBeInstanceOf(
      ApiError
    );
  });

  it('propaga el error cuando las credenciales son incorrectas', async () => {
    post.mockRejectedValue(
      new ApiError({ mensaje: 'Correo o contrasena incorrectos.', status: 401, tipo: 'http' })
    );

    await expect(iniciarSesion('ana.rojas@uct.cl', 'mala')).rejects.toMatchObject({
      mensaje: 'Correo o contrasena incorrectos.',
      status: 401,
    });
  });

  it('obtiene el usuario actual desde la ruta del contrato', async () => {
    get.mockResolvedValue(usuarioTecnico);

    const usuario = await obtenerUsuarioActual();

    expect(get).toHaveBeenCalledWith('/autenticacion/usuario-actual');
    expect(usuario).toEqual(usuarioTecnico);
  });
});
