import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { signInRequest } from '../api/authService';
import { decodeToken } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (correo, password) => {
    const { token: nuevoToken } = await signInRequest(correo, password);
    const datos = decodeToken(nuevoToken);

    if (!datos) {
      throw new Error('El token recibido no es válido');
    }

    setToken(nuevoToken);
    setUser(datos);
    return datos;
  }, []);

  const signOut = useCallback(async () => {
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
