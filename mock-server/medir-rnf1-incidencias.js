// Mide los tiempos de creacion de incidencias para documentar RNF1 (< 2 segundos)
// en el Sprint 2: con y sin evidencia adjunta.
//
// Uso:
//   node medir-rnf1-incidencias.js https://scgi-info1173-1.onrender.com
//
// Para medir tambien el flujo completo con una foto real subida a Cloudinary,
// definir antes las variables (PowerShell):
//   $env:CLOUDINARY_CLOUD_NAME = "l75ago2l"
//   $env:CLOUDINARY_UPLOAD_PRESET = "scgi_preset"
//
// Cada medicion crea incidencias nuevas en el mock (viven en memoria y se
// pierden cuando Render reinicia el servicio).

const fs = require('fs');
const path = require('path');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '') + '/api/v1';
const REPETICIONES = 10;
const REPETICIONES_CLOUDINARY = 5;
const LIMITE_MS = 2000;

const CORREO = 'ana.rojas@uct.cl';
const CONTRASENA = 'Secreta123';
const ID_ACTIVO = 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21';
const ID_TIPO_FOTOGRAFIA = 1;

// Imagen ya subida a Cloudinary: mide solo la API, sin depender de la subida.
const URL_EVIDENCIA =
  'https://res.cloudinary.com/l75ago2l/image/upload/v1793412343/scgi_incidencias/czptumgwsacmqlr5vtfm.png';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

// Foto de prueba para el flujo completo (393 KB, similar a una foto comprimida).
const RUTA_IMAGEN = path.join(__dirname, '..', 'mobile', 'assets', 'icon.png');

async function cronometrar(ejecutar) {
  const inicio = performance.now();
  await ejecutar();

  return Math.round(performance.now() - inicio);
}

async function exigirOk(respuesta, nombre) {
  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`${nombre} respondio ${respuesta.status}: ${texto}`);
  }

  return respuesta.json();
}

function resumir(nombre, tiempos, referencial = false) {
  const minimo = Math.min(...tiempos);
  const maximo = Math.max(...tiempos);
  const promedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);

  return { nombre, minimo, promedio, maximo, cumple: maximo < LIMITE_MS, referencial };
}

async function iniciarSesion() {
  const respuesta = await fetch(`${BASE}/autenticacion/inicio-sesion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
  });

  return exigirOk(respuesta, 'POST /autenticacion/inicio-sesion');
}

async function crearIncidencia(cabeceras, numero) {
  const respuesta = await fetch(`${BASE}/incidencias`, {
    method: 'POST',
    headers: { ...cabeceras, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_activo: ID_ACTIVO,
      titulo: `Medicion RNF1 ${numero}`,
      descripcion: 'Incidencia creada por medir-rnf1-incidencias.js',
      prioridad: 'media',
    }),
  });

  return exigirOk(respuesta, 'POST /incidencias');
}

async function adjuntarEvidencia(cabeceras, idIncidencia, urlEvidencia) {
  const respuesta = await fetch(`${BASE}/incidencias/${idIncidencia}/evidencias`, {
    method: 'POST',
    headers: { ...cabeceras, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_tipo_evidencia: ID_TIPO_FOTOGRAFIA, url_evidencia: urlEvidencia }),
  });

  return exigirOk(respuesta, 'POST /incidencias/{id}/evidencias');
}

async function subirACloudinary(imagen) {
  const formulario = new FormData();
  formulario.append('file', new Blob([imagen], { type: 'image/png' }), 'medicion-rnf1.png');
  formulario.append('upload_preset', UPLOAD_PRESET);

  const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formulario,
  });

  const datos = await exigirOk(respuesta, 'Subida a Cloudinary');

  return datos.secure_url;
}

async function principal() {
  console.log(`Midiendo ${BASE}`);
  console.log(`Repeticiones: ${REPETICIONES}. Limite RNF1: ${LIMITE_MS} ms.\n`);

  // 1. Primera peticion: incluye el arranque del servicio si estaba dormido.
  const arranque = await cronometrar(iniciarSesion);
  console.log(`Arranque: ${arranque} ms\n`);

  const { token, usuario } = await iniciarSesion();
  const cabeceras = { Authorization: `Bearer ${token}` };
  const resumenes = [];
  let contador = 0;

  // A. Creacion sin evidencia.
  const sinEvidencia = [];
  for (let i = 0; i < REPETICIONES; i += 1) {
    contador += 1;
    sinEvidencia.push(await cronometrar(() => crearIncidencia(cabeceras, contador)));
  }
  resumenes.push(resumir('A. POST /incidencias (sin evidencia)', sinEvidencia));

  // B. Adjuntar una evidencia a una incidencia ya creada.
  const soloEvidencia = [];
  for (let i = 0; i < REPETICIONES; i += 1) {
    contador += 1;
    const incidencia = await crearIncidencia(cabeceras, contador);
    soloEvidencia.push(
      await cronometrar(() => adjuntarEvidencia(cabeceras, incidencia.id_incidencia, URL_EVIDENCIA))
    );
  }
  resumenes.push(resumir('B. POST /incidencias/{id}/evidencias', soloEvidencia));

  // C. Creacion con una evidencia: las dos peticiones que hace la app.
  const conEvidencia = [];
  for (let i = 0; i < REPETICIONES; i += 1) {
    contador += 1;
    conEvidencia.push(
      await cronometrar(async () => {
        const incidencia = await crearIncidencia(cabeceras, contador);
        await adjuntarEvidencia(cabeceras, incidencia.id_incidencia, URL_EVIDENCIA);
      })
    );
  }
  resumenes.push(resumir('C. Creacion con 1 evidencia (incidencia + evidencia)', conEvidencia));

  // D. Flujo completo con una foto real (opcional).
  if (CLOUD_NAME && UPLOAD_PRESET) {
    const imagen = fs.readFileSync(RUTA_IMAGEN);
    const kb = Math.round(imagen.length / 1024);
    const completo = [];

    for (let i = 0; i < REPETICIONES_CLOUDINARY; i += 1) {
      contador += 1;
      completo.push(
        await cronometrar(async () => {
          const incidencia = await crearIncidencia(cabeceras, contador);
          const url = await subirACloudinary(imagen);
          await adjuntarEvidencia(cabeceras, incidencia.id_incidencia, url);
        })
      );
    }

    resumenes.push(
      resumir(`D. Flujo completo con foto de ${kb} KB (Cloudinary + API)`, completo, true)
    );
  } else {
    console.log('Escenario D omitido: faltan CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET.\n');
  }

  console.log('| Escenario | Minimo | Promedio | Maximo | Cumple RNF1 |');
  console.log('|---|---|---|---|---|');

  for (const r of resumenes) {
    const cumple = r.referencial ? `Referencial (${r.cumple ? 'bajo' : 'sobre'} 2 s)` : r.cumple ? 'Si' : 'No';
    console.log(`| ${r.nombre} | ${r.minimo} ms | ${r.promedio} ms | ${r.maximo} ms | ${cumple} |`);
  }

  const apiCumple = resumenes.filter((r) => !r.referencial).every((r) => r.cumple);

  console.log(`\nUsuario de prueba: ${usuario.correo} (${usuario.rol.nombre_rol})`);
  console.log(`Incidencias creadas en esta medicion: ${contador}`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(
    apiCumple
      ? '\nRESULTADO: la creacion de incidencias, con y sin evidencia, responde bajo 2 segundos.'
      : '\nRESULTADO: algun escenario de la API supero los 2 segundos. Revisar el detalle.'
  );
}

principal().catch((error) => {
  console.error('Fallo la medicion:', error.message);
  process.exit(1);
});