// === SIMULACIÓN DE MÓDULOS DE REACT NATIVE ===
const ASSET_REGEX = /^UCT-[A-Z]{3}-\d{4}$/;
let memoriaLocal = []; // Simula el AsyncStorage

// TAREAS 3 y 4: Validación y Feedback
const validarCodigoActivo = (codigoEscaneado) => {
  const codigoLimpio = codigoEscaneado.trim().toUpperCase();
  if (ASSET_REGEX.test(codigoLimpio)) {
    console.log(`[App] 📱 Vibración de ÉXITO (100ms)`);
    return { esValido: true, codigo: codigoLimpio };
  } else {
    console.log(`[App] 📱 Vibración de ERROR y Alerta visual en pantalla`);
    return { esValido: false, codigo: codigoLimpio };
  }
};

// TAREA 5: Conexión a assetService (Simulada)
const buscarActivoPorCodigo = async (codigo) => {
  console.log(`[Red] 🌐 Consultando backend Node.js para: ${codigo}...`);
  
  // Simulamos que el backend solo conoce el código 1024
  if (codigo === 'UCT-INF-1024') {
    return { encontrado: true, datos: { id: codigo, nombre: "Monitor Dell", estado: "Operativo" } };
  } else {
    return { encontrado: false, mensaje: "Código no registrado" };
  }
};

// TAREA 6: Registro en Memoria
const guardarEscaneoEnMemoria = (codigo) => {
  memoriaLocal = [codigo, ...memoriaLocal.filter(c => c !== codigo)].slice(0, 10);
  console.log(`[Memoria] 💾 Historial actualizado:`, memoriaLocal);
};


// === PRUEBA DEL FLUJO COMPLETO ===
const probarFlujo = async () => {
  console.log("=== INICIANDO PRUEBA DE FLUJO DE ESCANEO ===\n");

  // Simulamos al usuario escaneando 3 cosas distintas
  const escaneosPrueba = [
    "UCT-INF-1024",   // Caso 1: Código válido y registrado
    "CODIGO-FALSO",   // Caso 2: Código con formato inválido
    "UCT-LAB-9999"    // Caso 3: Código válido pero no registrado en BD
  ];

  for (const escaneo of escaneosPrueba) {
    console.log(`📷 La cámara acaba de leer: "${escaneo}"`);

    // 1. Pasa por tu validador
    const resultadoValidacion = validarCodigoActivo(escaneo);

    if (resultadoValidacion.esValido) {
      // 2. Si es válido, va al backend
      const resultadoAPI = await buscarActivoPorCodigo(resultadoValidacion.codigo);

      if (resultadoAPI.encontrado) {
         console.log(`✅ RESULTADO: Navegar a FICHA del activo ->`, resultadoAPI.datos);
         // 3. Se guarda en el historial
         guardarEscaneoEnMemoria(resultadoValidacion.codigo);
      } else {
         console.log(`⚠️ RESULTADO: Activo no existe -> Navegar a BÚSQUEDA MANUAL.`);
      }
    } else {
      console.log(`❌ RESULTADO: Escaneo rechazado, esperando siguiente lectura.`);
    }
    console.log("--------------------------------------------------");
  }
};

// Ejecutar prueba
probarFlujo();