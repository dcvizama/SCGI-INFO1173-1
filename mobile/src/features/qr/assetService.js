// src/features/qr/assetService.js
// Adaptador del escáner: consulta el activo real por código QR (RF2) usando
// el servicio de activos y el cliente HTTP de la app.
import { obtenerActivoPorCodigoQr } from '../../services/assetService';

// Devuelve el activo si existe, o null si el código no está registrado.
// Otros errores (red, sesión, servidor) se propagan para que el controlador los maneje.
export const buscarActivo = async (codigo) => {
  try {
    return await obtenerActivoPorCodigoQr(codigo);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
};