import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { deleteToken, getToken, saveToken } from '../../storage/secureStorage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('../../storage/secureStorage', () => ({
  getToken: jest.fn(),
  saveToken: jest.fn(),
  deleteToken: jest.fn(),
}));

const TOKEN_VIGENTE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGIzN2NmNS1lMTQ5LTU0NjgtOTE4OS0xYWMyYmNjZWNmYzMiLCJub21icmUiOiJBbmEiLCJhcGVsbGlkbyI6IlJlcG9ydGFudGUiLCJjb3JyZW8iOiJyZXBvcnRhbnRlQHVjdC5jbCIsInJvbCI6IlJlcG9ydGFudGUiLCJleHAiOjE4OTM0NTYwMDB9.mock-signature-no-verificada';

const TOKEN_EXPIRADO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDBhNDc1OC1kNTE1LTVjNTMtOTQzYy01ODEyNDkxYmI1ODgiLCJub21icmUiOiJCcnVubyIsImFwZWxsaWRvIjoiU290byIsImNvcnJlbyI6InN1cGVydmlzb3JAdWN0LmNsIiwicm9sIjoiU3VwZXJ2aXNvciIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature-no-verificada';

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
  });

  it('signIn crea la sesión con el rol leído del JWT', async () => {
    const result = await montarSesion();

    await act(async () => {
      await result.current.signIn('supervisor@uct.cl', 'test1234');
    });

    expect(result.current.user.rol).toBe('Supervisor');
    expect(result.current.user.correo).toBe('supervisor@uct.cl');
    expect(result.current.token).toBeTruthy();
    expect(saveToken).toHaveBeenCalledTimes(1);
  });

  it('signIn rechaza credenciales inválidas y no deja sesión abierta', async () => {
    const result = await montarSesion();

    await expect(result.current.signIn('admin@uct.cl', 'clave-mala')).rejects.toThrow(
      'Correo o contraseña incorrectos'
    );

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(saveToken).not.toHaveBeenCalled();
  });

  it('signOut limpia la sesión y borra el token almacenado', async () => {
    const result = await montarSesion();

    await act(async () => {
      await result.current.signIn('tecnico@uct.cl', 'test1234');
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.token).toBeNull();
    expect(deleteToken).toHaveBeenCalledTimes(1);
  });

  it('restaura la sesión guardada al iniciar la app', async () => {
    getToken.mockResolvedValue(TOKEN_VIGENTE);

    const result = await montarSesion();

    expect(result.current.token).toBe(TOKEN_VIGENTE);
    expect(result.current.user.rol).toBe('Reportante');
  });

  it('descarta y borra el token guardado si está vencido', async () => {
    getToken.mockResolvedValue(TOKEN_EXPIRADO);

    const result = await montarSesion();

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(deleteToken).toHaveBeenCalledTimes(1);
  });
});
