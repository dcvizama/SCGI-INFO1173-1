// src/features/qr/assetValidator.js
import { Vibration } from 'react-native';

const ASSET_REGEX = /^UCT-[A-Z]{3}-\d{4}$/;

export const validarCodigoActivo = (codigoEscaneado) => {
  const codigoLimpio = String(codigoEscaneado ?? '').trim().toUpperCase();

  if (ASSET_REGEX.test(codigoLimpio)) {
    Vibration.vibrate(100);
    return { esValido: true, codigo: codigoLimpio };
  }

  Vibration.vibrate([0, 150, 100, 150]);
  return { esValido: false, codigo: codigoLimpio };
};