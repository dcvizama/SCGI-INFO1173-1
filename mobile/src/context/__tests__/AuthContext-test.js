import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { iniciarSesion, obtenerUsuarioActual } from '../../services/authService';
import { deleteToken, getToken, saveToken } from '../../storage/secureStorage';

jest.mock('../../storage/secureStorage', () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
  deleteToken: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
  iniciarSesion: jest.fn(),
  obtenerUsuarioActual: jest.fn(),
}));

jest.mock('../../api/client', () => ({
  setOnUnauthorized: jest.fn(),
}));

const TOKEN_VIGENTE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGIzN2NmNS1lMTQ5LTU0NjgtOTE4OS0xYWMyYmNjZWNmYzMiLCJub21icmUiOiJBbmEiLCJhcGVsbGlkbyI6IlJlcG9ydGFudGUiLCJjb3JyZW8iOiJyZXBvcnRhbnRlQHVjdC5jbCIsInJvbCI6IlJlcG9ydGFudGUiLCJleHAiOjE4OTM0NTYwMDB9.mock-signature-no-verificada';

const TOKEN_EXPIRADO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDBhNDc1OC1kNTE1LTVjNTMtOTQzYy01ODEyNDkxYmI1ODgiLCJub21icmUiOiJCcnVubyIsImFwZWxsaWRvIjoiU290byIsImNvcnJlbyI6InN1cGVydmlzb3JAdWN0LmNsIiwicm9sIjoiU3VwZXJ2aXNvciIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature-no-verificada';

const USUARIO_REPORTANTE = {
  id_usuario: '8f14e45f-ce9a-4a1b-9b1f-2d7b5a9c0e11',
  nombre: 'Ana',
  apellido: 'Rojas',
  correo: 'ana.rojas@uct.cl',
  rol: { id_rol: 1, nombre_rol: 'REPORTANTE' },
};

const USUARIO_SUPERVISOR = {
  id_usuario: '3f6c2a1e-8b4d-4c2a-9f1e-2d7b5a9c0e12',
  nombre: 'Luis',
  apellido: 'Munoz',
  correo: 'luis.munoz@uct.cl',
  rol: { id_rol: 2, nombre_rol: 'SUPERVISOR' },
};

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

async function montarSesion() {
  const { result } = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return result;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getToken.mockResolvedValue(null);
  });

  it('arranca sin sesión cuando no hay token guardado', async () => {
    const result = await montarSesion();

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(obtenerUsuarioActual).not.toHaveBeenCalled();
  });

  it('signIn crea la sesión con el usuario que entrega el servidor', async () => {
    iniciarSesion.mockResolvedValue({ token: TOKEN_VIGENTE, usuario: USUARIO_SUPERVISOR });

    const result = await montarSesion();

    await act(async () => {
      await result.current.signIn('luis.munoz@uct.cl', 'Secreta123');
    });

    expect(result.current.user.rol.nombre_rol).toBe('SUPERVISOR');
    expect(result.current.user.correo).toBe('luis.munoz@uct.cl');
    expect(result.current.token).toBe(TOKEN_VIGENTE);
    expect(saveToken).toHaveBeenCalledWith(TOKEN_VIGENTE);
  });

  it('signIn propaga el error de credenciales y no deja sesión abierta', async () => {
    iniciarSesion.mockRejectedValue(new Error('Credenciales incorrectas'));

    const result = await montarSesion();

    await expect(result.current.signIn('ana.rojas@uct.cl', 'clave-mala')).rejects.toThrow(
      'Credenciales incorrectas'
    );

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(saveToken).not.toHaveBeenCalled();
  });

  it('signOut limpia la sesión y borra el token almacenado', async () => {
    iniciarSesion.mockResolvedValue({ token: TOKEN_VIGENTE, usuario: USUARIO_REPORTANTE });

    const result = await montarSesion();

    await act(async () => {
      await result.current.signIn('ana.rojas@uct.cl', 'Secreta123');
    });
    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(deleteToken).toHaveBeenCalledTimes(1);
  });

  it('restaura la sesión guardada validándola contra el servidor', async () => {
    getToken.mockResolvedValue(TOKEN_VIGENTE);
    obtenerUsuarioActual.mockResolvedValue(USUARIO_REPORTANTE);

    const result = await montarSesion();

    expect(result.current.token).toBe(TOKEN_VIGENTE);
    expect(result.current.user.rol.nombre_rol).toBe('REPORTANTE');
  });

  it('descarta el token vencido sin llamar al servidor', async () => {
    getToken.mockResolvedValue(TOKEN_EXPIRADO);

    const result = await montarSesion();

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(deleteToken).toHaveBeenCalledTimes(1);
    expect(obtenerUsuarioActual).not.toHaveBeenCalled();
  });

  it('cierra la sesión si el servidor rechaza el token guardado', async () => {
    getToken.mockResolvedValue(TOKEN_VIGENTE);
    obtenerUsuarioActual.mockRejectedValue(new Error('Tu sesión no es válida o expiró.'));

    const result = await montarSesion();

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(deleteToken).toHaveBeenCalled();
  });
});
