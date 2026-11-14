// src/features/incident/photoCaptureService.js
// Captura una foto con el CameraView que se le pasa por ref y devuelve su URI.
// No tiene interfaz propia: la pantalla que monta la cámara es quien le pasa la ref.

export async function capturarFoto(cameraRef, opciones = {}) {
  if (!cameraRef || !cameraRef.current) {
    throw new Error('La cámara no está lista para capturar.');
  }

  try {
    const foto = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      skipProcessing: false,
      ...opciones,
    });

    if (!foto || !foto.uri) {
      throw new Error('La captura no devolvió una imagen.');
    }

    return foto.uri;
  } catch (error) {
    throw new Error(`No se pudo capturar la foto: ${error.message}`);
  }
}