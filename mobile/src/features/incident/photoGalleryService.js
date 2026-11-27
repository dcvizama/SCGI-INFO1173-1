// src/features/incident/photoGalleryService.js
// Obtiene fotos para la evidencia con las pantallas nativas del sistema: la galería
// o la cámara del teléfono. Devuelve sus URIs; no tiene interfaz propia.

import * as ImagePicker from 'expo-image-picker';

export async function seleccionarFotosGaleria({ limite = 5 } = {}) {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    throw new Error('Se necesita permiso para acceder a la galería.');
  }

  try {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limite,
      quality: 1,
    });

    // Si el usuario cancela, no es un error: devolvemos una lista vacía.
    if (resultado.canceled || !resultado.assets) {
      return [];
    }

    return resultado.assets.map((asset) => asset.uri);
  } catch (error) {
    throw new Error(`No se pudo abrir la galería: ${error.message}`);
  }
}

// Abre la cámara del teléfono para tomar una foto. Devuelve su URI, o null si el
// usuario cancela. Usa la app de cámara del sistema en vez de una vista propia, que
// en algunos teléfonos con Expo Go queda en negro.
export async function tomarFotoConCamara() {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    throw new Error('Se necesita permiso para usar la cámara.');
  }

  try {
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });

    if (resultado.canceled || !resultado.assets?.length) {
      return null;
    }

    return resultado.assets[0].uri;
  } catch (error) {
    throw new Error(`No se pudo abrir la cámara: ${error.message}`);
  }
}
