export const buscarActivo = async (codigo) => {
  // Simulación de tiempo de carga del servidor
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Para la prueba, simulamos que solo este activo existe en la BD
  return codigo === "UCT-INF-1024"; 
};