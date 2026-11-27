// Mide los tiempos del cambio de estado de una incidencia para documentar RNF1
// (< 2 segundos) en el Sprint 3: clasificar, asignar y avanzar el estado, tal
// como lo hace la app.
//
// Uso:
//   node medir-rnf1-ciclo-vida.js https://scgi-info1173-1.onrender.com
//
// Cada repeticion crea una incidencia nueva y la lleva de Pendiente de revision
// a En reparacion. Viven en memoria y se pierden cuando Render reinicia el servicio.

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '') + '/api/v1';
const REPETICIONES = 10;
const LIMITE_MS = 2000;

const CONTRASENA = 'Secreta123';
const ID_ACTIVO = 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21';
const EN_DIAGNOSTICO = 4;
const EN_REPARACION = 5;

async function cronometrar(ejecutar) {
  const inicio = performance.now();
  await ejecutar();

  return Math.round(performance.now() - inicio);
}

async function pedir(metodo, ruta, token, cuerpo) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`${metodo} ${ruta} respondio ${respuesta.status}: ${texto}`);
  }

  return respuesta.json();
}

function resumir(nombre, tiempos) {
  const minimo = Math.min(...tiempos);
  const maximo = Math.max(...tiempos);
  const promedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);

  return { nombre, minimo, promedio, maximo, cumple: maximo < LIMITE_MS };
}

async function iniciarSesion(correo) {
  const { token, usuario } = await pedir('POST', '/autenticacion/inicio-sesion', null, {
    correo,
    contrasena: CONTRASENA,
  });

  return { token, usuario };
}

async function principal() {
  console.log(`Midiendo ${BASE}`);
  console.log(`Repeticiones: ${REPETICIONES}. Limite RNF1: ${LIMITE_MS} ms.\n`);

  // Primera peticion: incluye el arranque del servicio si estaba dormido.
  const arranque = await cronometrar(() => fetch(BASE.replace(/\/api\/v1$/, '')));
  console.log(`Arranque: ${arranque} ms\n`);

  const ana = await iniciarSesion('ana.rojas@uct.cl');
  const luis = await iniciarSesion('luis.munoz@uct.cl');
  const marta = await iniciarSesion('marta.silva@uct.cl');
  const idMarta = marta.usuario.id_usuario;

  const tiempos = { clasificar: [], asignar: [], estado: [], estadoConHistorial: [] };

  for (let i = 1; i <= REPETICIONES; i += 1) {
    const { id_incidencia: id } = await pedir('POST', '/incidencias', ana.token, {
      id_activo: ID_ACTIVO,
      titulo: `Medicion RNF1 ciclo de vida ${i}`,
      descripcion: 'Incidencia creada por medir-rnf1-ciclo-vida.js',
    });
    const ruta = `/incidencias/${id}`;

    // A. El supervisor la clasifica (Pendiente de revision a Clasificada).
    tiempos.clasificar.push(
      await cronometrar(() =>
        pedir('PATCH', `${ruta}/clasificacion`, luis.token, { prioridad: 'alta' })
      )
    );

    // B. El supervisor asigna al tecnico. La app crea la orden y relee la incidencia.
    tiempos.asignar.push(
      await cronometrar(async () => {
        await pedir('POST', '/ordenes-trabajo', luis.token, {
          id_incidencia: id,
          id_tecnico: idMarta,
        });
        await pedir('GET', ruta, luis.token);
      })
    );

    // C. El tecnico cambia el estado (Asignada a En diagnostico).
    tiempos.estado.push(
      await cronometrar(() =>
        pedir('PATCH', `${ruta}/estado`, marta.token, {
          id_estado: EN_DIAGNOSTICO,
          comentario: 'Se revisa el equipo.',
        })
      )
    );

    // D. Lo mismo que espera el usuario en la app: el cambio de estado y la
    // recarga del historial para la linea de tiempo (En diagnostico a En reparacion).
    tiempos.estadoConHistorial.push(
      await cronometrar(async () => {
        await pedir('PATCH', `${ruta}/estado`, marta.token, {
          id_estado: EN_REPARACION,
          comentario: 'Se cambia la pieza danada.',
        });
        await pedir('GET', `${ruta}/historial`, marta.token);
      })
    );
  }

  const resumenes = [
    resumir('A. PATCH /incidencias/{id}/clasificacion', tiempos.clasificar),
    resumir('B. Asignar: POST /ordenes-trabajo + GET /incidencias/{id}', tiempos.asignar),
    resumir('C. PATCH /incidencias/{id}/estado', tiempos.estado),
    resumir('D. Cambio de estado + GET .../historial (como la app)', tiempos.estadoConHistorial),
  ];

  console.log('| Escenario | Minimo | Promedio | Maximo | Cumple RNF1 |');
  console.log('|---|---|---|---|---|');

  for (const r of resumenes) {
    console.log(
      `| ${r.nombre} | ${r.minimo} ms | ${r.promedio} ms | ${r.maximo} ms | ${r.cumple ? 'Si' : 'No'} |`
    );
  }

  console.log(`\nUsuarios: ${luis.usuario.correo} (SUPERVISOR) y ${marta.usuario.correo} (TECNICO)`);
  console.log(`Incidencias creadas en esta medicion: ${REPETICIONES}`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(
    resumenes.every((r) => r.cumple)
      ? '\nRESULTADO: clasificar, asignar y cambiar el estado responden bajo 2 segundos.'
      : '\nRESULTADO: algun escenario supero los 2 segundos. Revisar el detalle.'
  );
}

principal().catch((error) => {
  console.error('Fallo la medicion:', error.message);
  process.exit(1);
});