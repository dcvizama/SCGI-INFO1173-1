// Mide los tiempos de respuesta de la API para documentar RNF1 (< 2 segundos).
//
// Uso:
//   node medir-rnf1.js https://scgi-info1173-1.onrender.com
//
// Mide por separado la primera peticion (arranque en frio del plan gratuito
// de Render) y las siguientes, que son las que representan el uso normal.

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '') + '/api/v1';
const REPETICIONES = 10;
const LIMITE_MS = 2000;

const CORREO = 'ana.rojas@uct.cl';
const CONTRASENA = 'Secreta123';
const CODIGO_QR = 'UCT-INF-1024';

async function medir(descripcion, ejecutar) {
  const inicio = Date.now();
  const respuesta = await ejecutar();
  const milisegundos = Date.now() - inicio;

  return { descripcion, milisegundos, status: respuesta.status };
}

function resumir(nombre, tiempos) {
  const minimo = Math.min(...tiempos);
  const maximo = Math.max(...tiempos);
  const promedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);

  return { nombre, minimo, promedio, maximo, cumple: maximo < LIMITE_MS };
}

async function principal() {
  console.log(`Midiendo ${BASE}`);
  console.log(`Repeticiones por ruta: ${REPETICIONES}. Limite RNF1: ${LIMITE_MS} ms.\n`);

  // 1. Primera peticion: incluye el arranque del servicio si estaba dormido.
  const arranque = await medir('Primera peticion (arranque)', () =>
    fetch(`${BASE}/autenticacion/inicio-sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
    })
  );

  console.log(`Arranque: ${arranque.milisegundos} ms (codigo ${arranque.status})\n`);

  // 2. Token para las rutas protegidas.
  const respuestaSesion = await fetch(`${BASE}/autenticacion/inicio-sesion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
  });

  if (!respuestaSesion.ok) {
    console.error('No se pudo iniciar sesion. Revisa la direccion y los datos semilla.');
    process.exit(1);
  }

  const { token, usuario } = await respuestaSesion.json();
  const cabeceras = { Authorization: `Bearer ${token}` };

  const rutas = [
    {
      nombre: 'POST /autenticacion/inicio-sesion',
      ejecutar: () =>
        fetch(`${BASE}/autenticacion/inicio-sesion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
        }),
    },
    {
      nombre: 'GET /autenticacion/usuario-actual',
      ejecutar: () => fetch(`${BASE}/autenticacion/usuario-actual`, { headers: cabeceras }),
    },
    {
      nombre: 'GET /activos/codigo-qr/{codigo}',
      ejecutar: () => fetch(`${BASE}/activos/codigo-qr/${CODIGO_QR}`, { headers: cabeceras }),
    },
    {
      nombre: 'GET /activos?busqueda=sala',
      ejecutar: () => fetch(`${BASE}/activos?busqueda=sala&limite=20`, { headers: cabeceras }),
    },
  ];

  const resumenes = [];

  for (const ruta of rutas) {
    const tiempos = [];

    for (let i = 0; i < REPETICIONES; i += 1) {
      const medicion = await medir(ruta.nombre, ruta.ejecutar);

      if (medicion.status >= 400) {
        console.error(`${ruta.nombre} respondio ${medicion.status}. Se detiene la medicion.`);
        process.exit(1);
      }

      tiempos.push(medicion.milisegundos);
    }

    resumenes.push(resumir(ruta.nombre, tiempos));
  }

  console.log('| Ruta | Minimo | Promedio | Maximo | Cumple RNF1 |');
  console.log('|---|---|---|---|---|');

  for (const r of resumenes) {
    console.log(
      `| ${r.nombre} | ${r.minimo} ms | ${r.promedio} ms | ${r.maximo} ms | ${r.cumple ? 'Si' : 'No'} |`
    );
  }

  const todasCumplen = resumenes.every((r) => r.cumple);

  console.log(`\nUsuario de prueba: ${usuario.correo} (${usuario.rol.nombre_rol})`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(
    todasCumplen
      ? '\nRESULTADO: con el servicio despierto, todas las rutas responden bajo 2 segundos.'
      : '\nRESULTADO: alguna ruta supero los 2 segundos. Revisar el detalle.'
  );
}

principal().catch((error) => {
  console.error('Fallo la medicion:', error.message);
  process.exit(1);
});