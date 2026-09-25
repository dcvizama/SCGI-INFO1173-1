import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@ultimos_escaneos';
const MAX_HISTORY_LENGTH = 10; // Guardar solo los últimos 10

export const guardarEscaneoEnMemoria = async (codigo) => {
  try {
    const historialActual = await obtenerHistorialEscaneos();
    
    // Evitar duplicados consecutivos y mantener el límite
    const nuevoHistorial = [codigo, ...historialActual.filter(c => c !== codigo)].slice(0, MAX_HISTORY_LENGTH);
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nuevoHistorial));
    return nuevoHistorial;
  } catch (error) {
    console.error("Error guardando el historial:", error);
  }
};

export const obtenerHistorialEscaneos = async () => {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error leyendo el historial:", error);
    return [];
  }
};