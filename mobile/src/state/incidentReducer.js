// Estado del reporte de incidencia (RF3). Es un reducer puro: no conoce React
// ni la API, así que se prueba solo y el contexto únicamente le despacha acciones.

export const PRIORIDADES = ['baja', 'media', 'alta'];
export const PRIORIDAD_POR_DEFECTO = 'media';

// Fotos de evidencia que se guardan en el borrador antes de subirlas (RF4).
export const MAX_FOTOS = 5;

// Estados del envío al servidor (T7).
export const ESTADOS_ENVIO = {
  INACTIVO: 'inactivo',
  ENVIANDO: 'enviando',
  EXITO: 'exito',
  ERROR: 'error',
};

export const ACCIONES = {
  INICIAR: 'incidencia/iniciar',
  CAMBIAR_CAMPO: 'incidencia/cambiarCampo',
  AGREGAR_FOTOS: 'incidencia/agregarFotos',
  QUITAR_FOTO: 'incidencia/quitarFoto',
  ENVIO_INICIADO: 'incidencia/envioIniciado',
  ENVIO_EXITOSO: 'incidencia/envioExitoso',
  ENVIO_FALLIDO: 'incidencia/envioFallido',
  REINICIAR: 'incidencia/reiniciar',
};

const CAMPOS_EDITABLES = ['titulo', 'descripcion', 'prioridad'];

const borradorVacio = {
  activo: null,
  titulo: '',
  descripcion: '',
  prioridad: PRIORIDAD_POR_DEFECTO,
  fotos: [], // URIs locales (cámara o galería), todavía sin subir a Cloudinary
};

export const estadoInicial = {
  borrador: borradorVacio,
  estadoEnvio: ESTADOS_ENVIO.INACTIVO,
  error: null, // { mensaje, tipo } del último envío fallido
  incidenciaCreada: null,
};

// La cámara de Expo entrega { uri, width, height }; la galería, URIs sueltas.
function uriDeFoto(foto) {
  const uri = typeof foto === 'string' ? foto : foto?.uri;
  return typeof uri === 'string' && uri.trim() !== '' ? uri : null;
}

function idDelActivo(activo) {
  return activo?.id_activo ?? activo?.codigo_qr ?? null;
}

function esMismoActivo(a, b) {
  const id = idDelActivo(a);
  return id !== null && id === idDelActivo(b);
}

// Aplica un cambio del usuario al borrador. Mientras se envía no se edita, y si
// el envío anterior falló, editar quita el mensaje de error.
function editarBorrador(estado, cambios) {
  if (estado.estadoEnvio === ESTADOS_ENVIO.ENVIANDO) return estado;

  const borrador = { ...estado.borrador, ...cambios };

  if (estado.estadoEnvio === ESTADOS_ENVIO.ERROR) {
    return { ...estado, borrador, estadoEnvio: ESTADOS_ENVIO.INACTIVO, error: null };
  }

  return { ...estado, borrador };
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

      return editarBorrador(estado, { [campo]: valor });
    }

    case ACCIONES.AGREGAR_FOTOS: {
      const nuevas = (Array.isArray(accion.fotos) ? accion.fotos : [accion.fotos])
        .map(uriDeFoto)
        .filter(Boolean);

      // Sin duplicados y sin pasar el máximo: lo que sobra se ignora.
      const fotos = [...new Set([...estado.borrador.fotos, ...nuevas])].slice(0, MAX_FOTOS);

      if (fotos.length === estado.borrador.fotos.length) return estado;

      return editarBorrador(estado, { fotos });
    }

    case ACCIONES.QUITAR_FOTO: {
      const fotos = estado.borrador.fotos.filter((uri) => uri !== accion.uri);

      if (fotos.length === estado.borrador.fotos.length) return estado;

      return editarBorrador(estado, { fotos });
    }

    case ACCIONES.ENVIO_INICIADO:
      return { ...estado, estadoEnvio: ESTADOS_ENVIO.ENVIANDO, error: null };

    case ACCIONES.ENVIO_EXITOSO:
      // Lo escrito ya quedó en el servidor: el borrador se vacía.
      return {
        ...estadoInicial,
        estadoEnvio: ESTADOS_ENVIO.EXITO,
        incidenciaCreada: accion.incidencia,
      };

    case ACCIONES.ENVIO_FALLIDO:
      // El borrador se conserva para que el usuario pueda reintentar.
      return { ...estado, estadoEnvio: ESTADOS_ENVIO.ERROR, error: accion.error };

    case ACCIONES.REINICIAR:
      // Cancelar descarta todo. No se permite a mitad de un envío: la petición
      // ya salió y su respuesta debe quedar registrada.
      if (estado.estadoEnvio === ESTADOS_ENVIO.ENVIANDO) return estado;

      return estadoInicial;

    default:
      return estado;
  }
}

// true si el usuario escribió o eligió algo que se perdería al salir.
export function hayCambios(estado) {
  const { titulo, descripcion, prioridad, fotos } = estado.borrador;

  return (
    titulo.trim() !== '' ||
    descripcion.trim() !== '' ||
    prioridad !== PRIORIDAD_POR_DEFECTO ||
    fotos.length > 0
  );
}

// Campos obligatorios de NuevaIncidencia que aún faltan en el borrador.
export function camposFaltantes(borrador) {
  const faltantes = [];

  if (!borrador.activo) faltantes.push('activo');
  if (borrador.titulo.trim() === '') faltantes.push('titulo');
  if (borrador.descripcion.trim() === '') faltantes.push('descripcion');

  return faltantes;
}

// Arma el cuerpo de POST /incidencias (esquema NuevaIncidencia del contrato v1.1.0).
// Las fotos no van aquí: se suben a Cloudinary y se adjuntan después como evidencias.
// prioridad todavía no está en el contrato, pero RF3 la exige: se envía igual y
// hay que pedir que se agregue como campo opcional (versión 1.2.0).
export function construirNuevaIncidencia(borrador) {
  return {
    id_activo: borrador.activo?.id_activo ?? null,
    titulo: borrador.titulo.trim(),
    descripcion: borrador.descripcion.trim(),
    prioridad: borrador.prioridad,
  };
}
