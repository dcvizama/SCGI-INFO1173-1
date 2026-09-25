import { validarCodigoActivo } from './assetValidator';
import { buscarActivo } from './assetService';
import { guardarEscaneoEnMemoria } from './scanHistory';

export const orquestarEscaneo = async (codigo, rolUsuario) => {
  // 1. Solución de seguridad: Aceptamos el rol con y sin tilde para evitar choques con el AuthContext
  if (rolUsuario !== 'Técnico' && rolUsuario !== 'Tecnico' && rolUsuario !== 'Reportante') {
    return { accion: 'alerta', titulo: 'Acceso Denegado', mensaje: 'Privilegios insuficientes.' };
  }

  // 2. Uso de la función del diagrama: Validamos el formato institucional del QR
  const validacion = validarCodigoActivo(codigo);
  if (!validacion.esValido) {
    return { accion: 'alerta', titulo: 'Formato Inválido', mensaje: `El código no pertenece a la universidad.` };
  }

  // 3. Uso de la función del diagrama: Guardamos el escaneo en el historial local
  const nuevoHistorial = await guardarEscaneoEnMemoria(validacion.codigo);

  try {
    // 4. Uso de la función del diagrama: Consultamos si el equipo existe en la base de datos
    const existeEnBD = await buscarActivo(validacion.codigo);
    
    if (existeEnBD) {
      // 5. Enrutamiento final basado en el actor del UML
      if (rolUsuario === 'Reportante') {
        return { accion: 'ir_a_incidencia', codigoValido: validacion.codigo, historial: nuevoHistorial };
      } else {
        // Aplica para el Técnico: Lo lleva a la Ficha de Equipo
        return { accion: 'ir_a_ficha_equipo', codigoValido: validacion.codigo, historial: nuevoHistorial };
      }
    } else {
      return { accion: 'ir_a_busqueda', titulo: 'No encontrado', mensaje: 'El activo no existe.', historial: nuevoHistorial };
    }
  } catch (error) {
    return { accion: 'alerta', titulo: 'Error', mensaje: 'Problema de conexión con el servidor.' };
  }
};