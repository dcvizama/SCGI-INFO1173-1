export const buscarActivo = async (codigo) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return codigo === "UCT-INF-1024";
};