import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setOnUnauthorized } from '../api/client';
import { iniciarSesion, obtenerUsuarioActual } from '../services/authService';
import { deleteToken, getToken, saveToken } from '../storage/secureStorage';
import { isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    await deleteToken();
    setToken(null);
    setUser(null);
  }, []);

  // Cualquier 401 en ruta protegida cierra la sesión (RNF4).
  // El 401 del login no lo dispara: ahí significa contraseña incorrecta.
  useEffect(() => {
    setOnUnauthorized(signOut);
  }, [signOut]);

  useEffect(() => {
    async function restaurarSesion() {
      try {
        const guardado = await getToken();

        if (!guardado) return;

        if (isTokenExpired(guardado)) {
          await deleteToken();
          return;
        }

        const usuario = await obtenerUsuarioActual();

        setToken(guardado);
        setUser(usuario);
      } catch {
        await deleteToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restaurarSesion();
  }, []);

  const signIn = useCallback(async (correo, contrasena) => {
    const sesion = await iniciarSesion(correo, contrasena);

    await saveToken(sesion.token);
    setToken(sesion.token);
    setUser(sesion.usuario);
    return sesion.usuario;
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, signIn, signOut }),
    [user, token, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}
