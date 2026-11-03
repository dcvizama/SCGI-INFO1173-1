// src/features/incident/photoGalleryService.js
// Selecciona fotos desde la galería del dispositivo (respaldo de la captura) y devuelve sus URIs.
// No tiene interfaz propia: abre el selector nativo del sistema.

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