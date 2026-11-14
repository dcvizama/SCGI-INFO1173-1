import { validarCodigoActivo } from './assetValidator';
import { buscarActivo } from './assetService';
import { guardarEscaneoEnMemoria } from './scanHistory';

export const orquestarEscaneo = async (codigo, rolUsuario) => {
  // 1. Solo TECNICO y REPORTANTE pueden escanear.
  if (rolUsuario !== 'TECNICO' && rolUsuario !== 'REPORTANTE') {
    return { accion: 'alerta', titulo: 'Acceso Denegado', mensaje: 'Privilegios insuficientes.' };
  }

  // 2. Validamos el formato institucional del QR.
  const validacion = validarCodigoActivo(codigo);
  if (!validacion.esValido) {
    return {
      accion: 'alerta',
      titulo: 'Formato Inválido',
      mensaje: 'El código no pertenece a la universidad.',
    };
  }

  // 3. Guardamos el escaneo en el historial local.
  const nuevoHistorial = await guardarEscaneoEnMemoria(validacion.codigo);

  try {
    // 4. Consultamos el activo real. Devuelve el activo o null si no existe.
    const activo = await buscarActivo(validacion.codigo);

    if (!activo) {
      return {
        accion: 'ir_a_busqueda',
        titulo: 'No encontrado',
        mensaje: 'El activo no existe.',
        historial: nuevoHistorial,
      };
    }

    // 5. Enrutamiento según el rol. Incluimos idActivo (UUID) para crear incidencias.
    const base = {
      codigoValido: validacion.codigo,
      idActivo: activo.id_activo,
      historial: nuevoHistorial,
    };

    return rolUsuario === 'REPORTANTE'
      ? { accion: 'ir_a_incidencia', ...base }
      : { accion: 'ir_a_ficha_equipo', ...base };
  } catch (_error) {
    return { accion: 'alerta', titulo: 'Error', mensaje: 'Problema de conexión con el servidor.' };
  }
};