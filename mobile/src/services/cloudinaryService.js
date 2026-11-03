import { ApiError, fetchSeguro, leerCuerpo } from '../api/client';

// Subida de evidencias fotográficas a Cloudinary (RF4).
//
// Reutiliza de client.js el control de HTTPS (RNF3), el timeout y ApiError,
// para que las pantallas manejen estos errores igual que los de la API.
// No usa request(): Cloudinary es un servicio externo, así que la petición
// no lleva el token JWT de la app ni la baseURL del backend.
//
// Subida sin firma (upload preset unsigned): la app solo conoce el cloud name
// y el preset. El API Key y el API Secret nunca están en la app.

const TIMEOUT_SUBIDA_MS = 30000;
export const MAX_FOTOS = 5;

const TIPOS_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

// Se lee en cada llamada; las pruebas pueden pasar su propia configuración.
function leerConfiguracion(opciones = {}) {
  return {
    cloudName: opciones.cloudName ?? process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: opciones.uploadPreset ?? process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    timeout: opciones.timeout ?? TIMEOUT_SUBIDA_MS,
  };
}

// Acepta la URI sola o el objeto de expo-camera / expo-image-picker ({ uri, mimeType }).
function prepararArchivo(foto) {
  const uri = typeof foto === 'string' ? foto : foto?.uri;

  if (!uri) {
    throw new ApiError({
      mensaje: 'Una de las fotos no se pudo leer. Vuelve a agregarla.',
      tipo: 'archivo',
    });
  }

  const ultimoTramo = uri.split('?')[0].split('/').pop() || 'foto.jpg';
  const extension = ultimoTramo.includes('.') ? ultimoTramo.split('.').pop().toLowerCase() : '';
  const nombre = extension ? ultimoTramo : `${ultimoTramo}.jpg`;
  const tipo = foto?.mimeType ?? TIPOS_MIME[extension] ?? 'image/jpeg';

  // Formato de archivo que entiende el FormData de React Native.
  return { uri, name: nombre, type: tipo };
}

function mensajePorEstadoCloudinary(status) {
  if (status === 400) return 'La foto no es válida o supera el tamaño permitido.';
  if (status === 401 || status === 403 || status === 404) {
    return 'La subida de fotos no está bien configurada. Avisa al equipo.';
  }
  if (status === 420 || status === 429) {
    return 'Se alcanzó el límite de subidas. Intenta más tarde.';
  }
  if (status >= 500) return 'El servicio de fotos no está disponible. Intenta más tarde.';

  return `La subida de la foto falló con el código ${status}.`;
}

// Sube una foto y devuelve la dirección lista para el contrato (url_evidencia).
export async function subirImagen(foto, opciones) {
  const { cloudName, uploadPreset, timeout } = leerConfiguracion(opciones);

  if (!cloudName || !uploadPreset) {
    throw new ApiError({
      mensaje:
        'Falta configurar Cloudinary. Revisa EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME y EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
      tipo: 'configuracion',
    });
  }

  const formulario = new FormData();
  formulario.append('file', prepararArchivo(foto));
  formulario.append('upload_preset', uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

  // Sin Content-Type: fetch lo arma con el boundary del multipart.
  const respuesta = await fetchSeguro(
    url,
    { method: 'POST', headers: { Accept: 'application/json' }, body: formulario },
    timeout,
  );

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    const error = new ApiError({
      mensaje: mensajePorEstadoCloudinary(respuesta.status),
      status: respuesta.status,
      tipo: 'http',
    });
    // Mensaje original de Cloudinary (en inglés), solo para registro.
    error.detalle = datos?.error?.message ?? null;
    throw error;
  }

  if (!datos?.secure_url) {
    throw new ApiError({
      mensaje: 'El servicio de fotos respondió sin la dirección de la imagen.',
      status: respuesta.status,
      tipo: 'http',
    });
  }

  // Siempre secure_url (HTTPS); nunca se arma la URL a mano.
  return {
    url_evidencia: datos.secure_url,
    public_id: datos.public_id,
    ancho: datos.width,
    alto: datos.height,
    bytes: datos.bytes,
    formato: datos.format,
  };
}

// Sube las fotos de a una, en orden. Si una falla, el error trae las que
// alcanzaron a subirse (error.subidas) para reintentar solo las que faltan.
export async function subirImagenes(fotos = [], opciones) {
  if (fotos.length > MAX_FOTOS) {
    throw new ApiError({
      mensaje: `Puedes adjuntar como máximo ${MAX_FOTOS} fotos.`,
      tipo: 'archivo',
    });
  }

  const subidas = [];

  for (const foto of fotos) {
    try {
      subidas.push(await subirImagen(foto, opciones));
    } catch (error) {
      error.subidas = subidas;
      error.indiceFallido = subidas.length;
      throw error;
    }
  }

  return subidas;
}