import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { signInRequest } from '../api/authService';
import { deleteToken, getToken, saveToken } from '../storage/secureStorage';
import { decodeToken, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restaurarSesion() {
      try {
        const guardado = await getToken();

        if (!guardado) return;

        if (isTokenExpired(guardado)) {
          await deleteToken();
          return;
        }

        setToken(guardado);
        setUser(decodeToken(guardado));
      } finally {
        setIsLoading(false);
      }
    }

    restaurarSesion();
  }, []);

  const signIn = useCallback(async (correo, password) => {
    const { token: nuevoToken } = await signInRequest(correo, password);
    const datos = decodeToken(nuevoToken);

    if (!datos) {
      throw new Error('El token recibido no es válido');
    }

    await saveToken(nuevoToken);
    setToken(nuevoToken);
    setUser(datos);
    return datos;
  }, []);

  const signOut = useCallback(async () => {
    await deleteToken();
    setToken(null);
    setUser(null);
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
