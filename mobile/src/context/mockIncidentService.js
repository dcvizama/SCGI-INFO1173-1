// Mock temporal de la creación de incidencias (T3). Responde lo mismo que
// POST /incidencias del contrato v1.1.0: recibe una NuevaIncidencia y devuelve
// la Incidencia en su primer estado del ciclo de vida ("Pendiente").
// fotos son las URIs locales del borrador; el servicio real las sube a Cloudinary
// y las adjunta con POST /incidencias/{id}/evidencias.
// En la tarea 6 el contexto pasa a usar services/incidentService.js
// y este archivo se borra.
//
// Para probar el estado de error en el teléfono: usar el título "simular error".

const DEMORA_MS = 800;

let correlativo = 0;

export async function crearIncidencia(nuevaIncidencia, fotos = []) {
  await new Promise((resolve) => setTimeout(resolve, DEMORA_MS));

  if (nuevaIncidencia.titulo.trim().toLowerCase() === 'simular error') {
    // Misma forma que ApiError de client.js.
    const error = new Error('El servidor tuvo un problema. Intenta más tarde.');
    error.mensaje = error.message;
    error.status = 500;
    error.tipo = 'http';
    throw error;
  }

  correlativo += 1;

  return {
    id_incidencia: `mock-${Date.now()}-${correlativo}`,
    id_activo: nuevaIncidencia.id_activo,
    id_reportante: 'mock-reportante',
    titulo: nuevaIncidencia.titulo,
    descripcion: nuevaIncidencia.descripcion,
    prioridad: nuevaIncidencia.prioridad,
    estado: { id_estado: 1, nombre_estado: 'Pendiente' },
    fecha_creacion: new Date().toISOString(),
    evidencias: fotos.map((uri) => ({ url_evidencia: uri })),
  };
}
