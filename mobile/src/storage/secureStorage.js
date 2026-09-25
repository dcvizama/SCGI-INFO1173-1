import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'scgi.session.token';

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Si no existe la clave, no hay nada que borrar
  }
}
