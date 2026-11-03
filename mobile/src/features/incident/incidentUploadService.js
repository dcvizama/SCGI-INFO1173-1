
// src/features/incident/incidentUploadService.js

import * as FileSystem from 'expo-file-system/legacy';
import { post, ApiError } from '../../api/client';
import { comprimirFoto } from './photoCompressor';

// Configuración de Cloudinary.
export const CLOUDINARY = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '',
};

// Confirmar con el backend que el ID 1 corresponde a fotografía.
export const ID_TIPO_EVIDENCIA_FOTO = 1;

const MAX_REINTENTOS = 3;
const ESPERA_BASE_MS = 1000;

export const crearEstadoEnvio = () => ({
  idIncidencia: null,
  urlPorFoto: {},
  adjuntadas: {},
});

const esperar = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function esReintentable(error) {
  if (!(error instanceof ApiError)) return false;

  return (
    error.tipo === 'sin_conexion' ||
    error.tipo === 'timeout' ||
    (error.status ?? 0) >= 500
  );
}

async function conReintentos(operacion) {
  let ultimoError;

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      return await operacion();
    } catch (error) {
      ultimoError = error;

      console.error(
        `[Envío] Intento ${intento}/${MAX_REINTENTOS}:`,
        error.message
      );

      if (!esReintentable(error) || intento === MAX_REINTENTOS) {
        break;
      }

      await esperar(ESPERA_BASE_MS * 2 ** (intento - 1));
    }
  }

  throw ultimoError;
}

// Comprueba si una URI corresponde a un archivo existente.
async function comprobarArchivo(uri, descripcion) {
  console.log(`[DEBUG] ${descripcion}:`, uri);

  if (!uri || typeof uri !== 'string') {
    throw new Error(`${descripcion}: la URI está vacía o no es válida.`);
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);

    console.log(`[DEBUG] Información de ${descripcion}:`, info);

    if (!info.exists) {
      throw new Error(
        `${descripcion}: el archivo no existe. URI: ${uri}`
      );
    }

    return info;
  } catch (error) {
    console.error(`[DEBUG] Error comprobando ${descripcion}:`, error);
    throw error;
  }
}

// Sube una imagen directamente a Cloudinary.
async function subirACloudinary(uri, { cloudName, uploadPreset }) {
  if (!cloudName?.trim() || !uploadPreset?.trim()) {
    throw new ApiError({
      mensaje:
        'Faltan las variables de configuración de Cloudinary en mobile/.env.',
      tipo: 'http',
    });
  }

  if (!uri || typeof uri !== 'string') {
    throw new ApiError({
      mensaje: 'La fotografía no tiene una URI válida.',
      tipo: 'http',
    });
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`;

  try {
    // Comprobar que la fotografía comprimida exista.
    const archivo = await comprobarArchivo(
      uri,
      'Archivo que se enviará a Cloudinary'
    );

    console.log('[Cloudinary] Iniciando subida multipart...');
    console.log('[Cloudinary] Tamaño:', archivo.size);

    const respuesta = await FileSystem.uploadAsync(url, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'image/jpeg',
      parameters: {
        upload_preset: uploadPreset.trim(),
      },
      headers: {
        Accept: 'application/json',
      },
    });

    let datos = {};

    try {
      datos = JSON.parse(respuesta.body);
    } catch {
      console.error(
        '[Cloudinary] Respuesta no válida:',
        respuesta.body
      );
    }

    if (respuesta.status < 200 || respuesta.status >= 300) {
      const mensaje =
        datos?.error?.message ??
        `Cloudinary respondió HTTP ${respuesta.status}.`;

      console.error('[Cloudinary] HTTP:', respuesta.status);
      console.error('[Cloudinary] Detalle:', mensaje);

      throw new ApiError({
        mensaje,
        status: respuesta.status,
        tipo: 'http',
      });
    }

    if (!datos.secure_url) {
      throw new ApiError({
        mensaje:
          'Cloudinary no devolvió una URL segura para la fotografía.',
        status: respuesta.status,
        tipo: 'http',
      });
    }

    console.log('[Cloudinary] Fotografía subida correctamente.');

    return datos.secure_url;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('[Cloudinary] Error durante la subida:', error);

    throw new ApiError({
      mensaje:
        `No se pudo subir la fotografía: ${error.message ?? 'Error desconocido'}`,
      tipo: 'sin_conexion',
    });
  }
}

// Envía la incidencia y sus fotografías.
export async function enviarIncidencia({
  idActivo,
  titulo,
  descripcion,
  fotosUris = [],
  cloudinary = CLOUDINARY,
  estado,
}) {
  if (!estado) {
    throw new Error('No se recibió el estado del envío.');
  }

  // 1. Comprimir y subir las fotografías pendientes.
  for (const uri of fotosUris) {
    if (estado.urlPorFoto[uri]) continue;

    console.log('[DEBUG] URI original recibida:', uri);

    // Comprobar que la fotografía original exista.
    await comprobarArchivo(uri, 'Fotografía original');

    console.log('[Envío] Comprimiendo fotografía...');

    const comprimida = await comprimirFoto(uri);

    console.log('[DEBUG] URI devuelta por el compresor:', comprimida);

    if (!comprimida || typeof comprimida !== 'string') {
      throw new Error(
        'El compresor no devolvió una URI válida.'
      );
    }

    // Comprobar que la fotografía comprimida exista.
    await comprobarArchivo(comprimida, 'Fotografía comprimida');

    console.log('[Envío] Subiendo fotografía a Cloudinary...');

    estado.urlPorFoto[uri] = await conReintentos(() =>
      subirACloudinary(comprimida, cloudinary)
    );
  }

  // 2. Crear la incidencia una sola vez.
  if (!estado.idIncidencia) {
    console.log('[Envío] Creando incidencia en el backend...');

    const creada = await post('/incidencias', {
      id_activo: idActivo,
      titulo,
      descripcion,
    });

    if (!creada?.id_incidencia) {
      throw new ApiError({
        mensaje: 'El servidor no devolvió la incidencia creada.',
        tipo: 'http',
      });
    }

    estado.idIncidencia = creada.id_incidencia;

    console.log('[Envío] Incidencia creada:', estado.idIncidencia);
  }

  // 3. Adjuntar las fotografías pendientes.
  for (const uri of fotosUris) {
    if (estado.adjuntadas[uri]) continue;

    console.log('[Envío] Adjuntando evidencia al backend...');

    await conReintentos(() =>
      post(`/incidencias/${estado.idIncidencia}/evidencias`, {
        id_tipo_evidencia: ID_TIPO_EVIDENCIA_FOTO,
        url_evidencia: estado.urlPorFoto[uri],
      })
    );

    estado.adjuntadas[uri] = true;

    console.log('[Envío] Evidencia adjuntada correctamente.');
  }

  console.log('[Envío] Proceso de envío completado.');

  return estado.idIncidencia;
}
