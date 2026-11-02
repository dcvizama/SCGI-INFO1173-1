// src/features/incident/photoCompressor.js
// Redimensiona (solo si es más ancha que el límite) y comprime a JPEG antes de subir.
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const ANCHO_MAXIMO = 1280;
const CALIDAD = 0.7;

const obtenerAncho = (uri) =>
  new Promise((resolve, reject) => Image.getSize(uri, (ancho) => resolve(ancho), reject));

export async function comprimirFoto(uri, { anchoMaximo = ANCHO_MAXIMO, calidad = CALIDAD } = {}) {
  if (!uri) {
    throw new Error('No se recibió la URI de la foto.');
  }

  // Si no se puede leer el tamaño, comprimimos sin redimensionar.
  let ancho = null;
  try {
    ancho = await obtenerAncho(uri);
  } catch {
    ancho = null;
  }

  const acciones = ancho && ancho > anchoMaximo ? [{ resize: { width: anchoMaximo } }] : [];

  const resultado = await ImageManipulator.manipulateAsync(uri, acciones, {
    compress: calidad,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return resultado.uri;
}