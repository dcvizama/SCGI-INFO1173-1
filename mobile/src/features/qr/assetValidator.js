import { Vibration, Alert } from 'react-native';

const ASSET_REGEX = /^UCT-[A-Z]{3}-\d{4}$/;

export const validarCodigoActivo = (codigoEscaneado) => {
  const codigoLimpio = codigoEscaneado.trim().toUpperCase();

  if (ASSET_REGEX.test(codigoLimpio)) {
    Vibration.vibrate(100);
    return { esValido: true, codigo: codigoLimpio };
  } else {
    Vibration.vibrate([0, 150, 100, 150]);
    Alert.alert(
      "Código Inválido",
      "El formato no corresponde a un activo institucional válido.",
      [{ text: "Entendido", style: "cancel" }]
    );
    return { esValido: false, codigo: codigoLimpio };
  }
};