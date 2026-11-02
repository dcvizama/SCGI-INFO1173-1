// src/screens/incident/camera/useIncidentCamera.js
// Hook de captura para la pantalla de incidencias. No tiene interfaz propia:
// la pantalla monta el CameraView y pasa cameraRef; el hook devuelve la URI de la foto.

import { useRef, useState } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { capturarFoto } from '../../../features/incident/photoCaptureService';

export function useIncidentCamera() {
  const cameraRef = useRef(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [capturando, setCapturando] = useState(false);

  const tomarFoto = async (opciones) => {
    if (capturando) return null;

    setCapturando(true);
    try {
      return await capturarFoto(cameraRef, opciones);
    } finally {
      setCapturando(false);
    }
  };

  return {
    cameraRef,
    permisoConcedido: permiso?.granted === true,
    pedirPermiso,
    capturando,
    tomarFoto,
  };
}