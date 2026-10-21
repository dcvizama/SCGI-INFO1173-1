// Estado del reporte de incidencia (RF3). Es un reducer puro: no conoce React
// ni la API, así que se prueba solo y el contexto únicamente le despacha acciones.

export const PRIORIDADES = ['baja', 'media', 'alta'];
export const PRIORIDAD_POR_DEFECTO = 'media';

export const ACCIONES = {
  INICIAR: 'incidencia/iniciar',
  CAMBIAR_CAMPO: 'incidencia/cambiarCampo',
};

const CAMPOS_EDITABLES = ['titulo', 'descripcion', 'prioridad'];

const borradorVacio = {
  activo: null,
  titulo: '',
  descripcion: '',
  prioridad: PRIORIDAD_POR_DEFECTO,
};

export const estadoInicial = {
  borrador: borradorVacio,
};

function idDelActivo(activo) {
  return activo?.id_activo ?? activo?.codigo_qr ?? null;
}

function esMismoActivo(a, b) {
  const id = idDelActivo(a);
  return id !== null && id === idDelActivo(b);
}

export function incidentReducer(estado, accion) {
  switch (accion.type) {
    case ACCIONES.INICIAR: {
      // Volver a abrir el reporte del mismo activo conserva lo ya escrito.
      if (esMismoActivo(estado.borrador.activo, accion.activo)) return estado;

      return { ...estadoInicial, borrador: { ...borradorVacio, activo: accion.activo ?? null } };
    }

    case ACCIONES.CAMBIAR_CAMPO: {
      const { campo, valor } = accion;

      if (!CAMPOS_EDITABLES.includes(campo)) return estado;
      if (campo === 'prioridad' && !PRIORIDADES.includes(valor)) return estado;
      if (campo !== 'prioridad' && typeof valor !== 'string') return estado;

      return { ...estado, borrador: { ...estado.borrador, [campo]: valor } };
    }

    default:
      return estado;
  }
}

// true si el usuario escribió o eligió algo que se perdería al salir.
export function hayCambios(estado) {
  const { titulo, descripcion, prioridad } = estado.borrador;

  return titulo.trim() !== '' || descripcion.trim() !== '' || prioridad !== PRIORIDAD_POR_DEFECTO;
}
