import { validarCodigoActivo } from '../utils/assetValidator';
import { buscarActivo } from '../services/assetService';
import { guardarEscaneoEnMemoria } from '../store/scanHistory';

export const orquestarEscaneo = async (codigo, rolUsuario) => {
  // Según el diagrama, solo Técnico y Reportante tienen el caso de uso <<include>> Escanear QR
  if (rolUsuario !== 'Técnico' && rolUsuario !== 'Reportante') {
    return { accion: 'alerta', titulo: '⛔ Acceso Denegado', mensaje: 'Tu rol no requiere usar el escáner QR según el diagrama de casos de uso.' };
  }

  if (!validarCodigoActivo(codigo)) {
    return { accion: 'alerta', titulo: '❌ Formato Inválido', mensaje: `El código ${codigo} no cumple con el formato.` };
  }

  const nuevoHistorial = await guardarEscaneoEnMemoria(codigo);

  try {
    const existeEnBD = await buscarActivo(codigo);
    
    if (existeEnBD) {
      // Bifurcación estricta del diagrama
      if (rolUsuario === 'Reportante') {
        return { accion: 'ir_a_incidencia', codigoValido: codigo, historial: nuevoHistorial };
      } else if (rolUsuario === 'Técnico') {
        return { accion: 'ir_a_historial_tecnico', codigoValido: codigo, historial: nuevoHistorial };
      }
    } else {
      return { accion: 'ir_a_busqueda', titulo: '⚠️ Código no registrado', mensaje: 'El activo no existe. Redirigiendo a búsqueda manual...', historial: nuevoHistorial };
    }
  } catch (error) {
    return { accion: 'alerta', titulo: '⚠️ Error', mensaje: 'Problema al conectar con assetService.' };
  }
};