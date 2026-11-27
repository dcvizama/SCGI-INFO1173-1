// Recorre el ciclo de vida completo de una incidencia contra el mock (contrato
// v1.3.0) y comprueba trazabilidad (RF6), asignacion (RF5) y notificaciones (RF8).
// Tambien comprueba los acuerdos con TI2: prioridad critica, clasificar una
// incidencia ya avanzada y asignar sin clasificar.
// Crea sus propias incidencias, asi se puede repetir sin gastar los datos semilla.
//
// Uso:
//   node probar-ciclo-vida.js                                  (mock local)
//   node probar-ciclo-vida.js https://scgi-info1173-1.onrender.com   (Render)

const RAIZ = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const BASE = `${RAIZ}/api/v1`;
const CONTRASENA = 'Secreta123';
const ID_PROYECTOR = 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21';
const TOKEN_PRUEBA = `ExponentPushToken[prueba-${Date.now()}]`;

let fallas = 0;

function comprobar(descripcion, condicion, detalle = '') {
  if (condicion) {
    console.log(`  OK    ${descripcion}`);
  } else {
    fallas += 1;
    console.log(`  FALLA ${descripcion}${detalle ? ` (${detalle})` : ''}`);
  }
}

async function pedir(metodo, ruta, { token, cuerpo } = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();

  return { status: respuesta.status, datos: texto ? JSON.parse(texto) : null };
}

async function iniciarSesion(correo) {
  const { status, datos } = await pedir('POST', '/autenticacion/inicio-sesion', {
    cuerpo: { correo, contrasena: CONTRASENA },
  });

  if (status !== 200) throw new Error(`No se pudo iniciar sesion con ${correo} (${status}).`);

  return datos.token;
}

async function main() {
  console.log(`Probando el ciclo de vida contra ${RAIZ}\n`);

  const inicio = await fetch(RAIZ).then((r) => r.json());
  comprobar('el servicio responde con el contrato 1.3.0 (RNF2)', inicio.contrato === '1.3.0', inicio.contrato);

  const ana = await iniciarSesion('ana.rojas@uct.cl');
  const luis = await iniciarSesion('luis.munoz@uct.cl');
  const marta = await iniciarSesion('marta.silva@uct.cl');

  console.log('\nDatos semilla');
  const estados = await pedir('GET', '/estados-incidencia', { token: ana });
  comprobar('hay 8 estados y solo Cerrada es final', estados.datos.length === 8 &&
    estados.datos.filter((e) => e.es_final).map((e) => e.nombre_estado).join() === 'Cerrada');
  const transiciones = await pedir('GET', '/estados-incidencia/transiciones', { token: ana });
  comprobar('la matriz tiene 10 transiciones', transiciones.datos.length === 10, transiciones.datos.length);
  comprobar('la matriz permite asignar sin clasificar (1 a 3, supervisor)', transiciones.datos.some((t) =>
    t.id_estado_origen === 1 && t.id_estado_destino === 3 && t.roles_permitidos.includes('SUPERVISOR')));
  const bandeja = await pedir('GET', '/incidencias?id_estado=1', { token: luis });
  comprobar('la bandeja del supervisor tiene pendientes', bandeja.datos.length >= 1);
  const tecnicos = await pedir('GET', '/usuarios?rol=TECNICO', { token: luis });
  const idMarta = tecnicos.datos[0]?.id_usuario;
  comprobar('GET /usuarios?rol=TECNICO devuelve a Marta sin contrasena',
    tecnicos.datos[0]?.correo === 'marta.silva@uct.cl' && !('contrasena' in tecnicos.datos[0]));
  const usuariosReportante = await pedir('GET', '/usuarios', { token: ana });
  comprobar('un reportante no puede listar usuarios (403)', usuariosReportante.status === 403);

  console.log('\nReporte y clasificacion (RF3, RF5)');
  const creada = await pedir('POST', '/incidencias', {
    token: ana,
    cuerpo: { id_activo: ID_PROYECTOR, titulo: 'Prueba ciclo de vida', descripcion: 'Creada por probar-ciclo-vida.js.' },
  });
  const id = creada.datos.id_incidencia;
  comprobar('Ana registra la incidencia en Pendiente de revision', creada.status === 201 && creada.datos.estado.id_estado === 1);
  const avisoSupervisor = await pedir('GET', '/notificaciones?leida=false', { token: luis });
  comprobar('el supervisor recibe nueva_incidencia', avisoSupervisor.datos.some((n) => n.id_incidencia === id && n.tipo === 'nueva_incidencia'));
  const atajo = await pedir('PATCH', `/incidencias/${id}/estado`, { token: luis, cuerpo: { id_estado: 3, comentario: 'Atajo.' } });
  comprobar('no se puede asignar por PATCH .../estado (409)', atajo.status === 409);
  const clasificada = await pedir('PATCH', `/incidencias/${id}/clasificacion`, { token: luis, cuerpo: { prioridad: 'media', comentario: 'Prueba.' } });
  comprobar('el supervisor la clasifica (Clasificada, prioridad media)', clasificada.status === 200 &&
    clasificada.datos.estado.id_estado === 2 && clasificada.datos.prioridad === 'media');
  const otraVez = await pedir('PATCH', `/incidencias/${id}/clasificacion`, { token: luis, cuerpo: { prioridad: 'critica' } });
  comprobar('clasificar otra vez solo cambia la prioridad (sigue Clasificada, critica)', otraVez.status === 200 &&
    otraVez.datos.estado.id_estado === 2 && otraVez.datos.prioridad === 'critica');
  const inventada = await pedir('PATCH', `/incidencias/${id}/clasificacion`, { token: luis, cuerpo: { prioridad: 'urgente' } });
  comprobar('rechaza una prioridad que no existe (400)', inventada.status === 400);

  console.log('\nAsignacion (RF5)');
  const orden = await pedir('POST', '/ordenes-trabajo', { token: luis, cuerpo: { id_incidencia: id, id_tecnico: idMarta } });
  comprobar('el supervisor crea la orden de trabajo (201)', orden.status === 201 && orden.datos.id_tecnico === idMarta);
  const repetida = await pedir('POST', '/ordenes-trabajo', { token: luis, cuerpo: { id_incidencia: id, id_tecnico: idMarta } });
  comprobar('no se asigna dos veces (409)', repetida.status === 409);
  const asignada = await pedir('GET', `/incidencias/${id}`, { token: ana });
  comprobar('la incidencia queda Asignada con id_tecnico_asignado', asignada.datos.estado.id_estado === 3 && asignada.datos.id_tecnico_asignado === idMarta);
  const avisoTecnico = await pedir('GET', '/notificaciones?leida=false', { token: marta });
  const notificacionTecnico = avisoTecnico.datos.find((n) => n.id_incidencia === id && n.tipo === 'incidencia_asignada');
  comprobar('el tecnico recibe incidencia_asignada', Boolean(notificacionTecnico));
  const leida = await pedir('PATCH', `/notificaciones/${notificacionTecnico?.id_notificacion}/leida`, { token: marta });
  comprobar('el tecnico la marca como leida', leida.status === 200 && leida.datos.leida === true && Boolean(leida.datos.fecha_lectura));
  const ajena = await pedir('PATCH', `/notificaciones/${notificacionTecnico?.id_notificacion}/leida`, { token: ana });
  comprobar('otro usuario no puede marcarla (404)', ajena.status === 404);

  console.log('\nAsignar sin clasificar (RF5, acuerdo con TI2)');
  const directa = await pedir('POST', '/incidencias', {
    token: ana,
    cuerpo: { id_activo: ID_PROYECTOR, titulo: 'Prueba asignar sin clasificar', descripcion: 'Creada por probar-ciclo-vida.js.', prioridad: 'critica' },
  });
  const idDirecta = directa.datos.id_incidencia;
  comprobar('Ana registra una incidencia con prioridad critica', directa.status === 201 && directa.datos.prioridad === 'critica');
  const ordenDirecta = await pedir('POST', '/ordenes-trabajo', { token: luis, cuerpo: { id_incidencia: idDirecta, id_tecnico: idMarta } });
  comprobar('el supervisor la asigna desde Pendiente de revision (201)', ordenDirecta.status === 201);
  const historialDirecta = await pedir('GET', `/incidencias/${idDirecta}/historial`, { token: ana });
  comprobar('el historial pasa de 1 a 3 sin Clasificada', historialDirecta.datos.map((h) => h.estado.id_estado).join() === '1,3');
  const reprioriza = await pedir('PATCH', `/incidencias/${idDirecta}/clasificacion`, { token: luis, cuerpo: { prioridad: 'alta' } });
  comprobar('se le cambia la prioridad ya asignada sin cambiar el estado', reprioriza.status === 200 &&
    reprioriza.datos.estado.id_estado === 3 && reprioriza.datos.prioridad === 'alta');

  console.log('\nCiclo de vida (RF6)');
  const reportanteAvanza = await pedir('PATCH', `/incidencias/${id}/estado`, { token: ana, cuerpo: { id_estado: 4, comentario: 'x' } });
  comprobar('el reportante no puede avanzarla (403)', reportanteAvanza.status === 403);
  const pasos = [
    [marta, 4, 'Se revisa el equipo.'],
    [marta, 5, 'Se cambia la lampara.'],
  ];
  for (const [token, idEstado, comentario] of pasos) {
    const r = await pedir('PATCH', `/incidencias/${id}/estado`, { token, cuerpo: { id_estado: idEstado, comentario } });
    comprobar(`pasa al estado ${idEstado}`, r.status === 200 && r.datos.estado.id_estado === idEstado, r.status);
  }
  const sinComentario = await pedir('PATCH', `/incidencias/${id}/estado`, { token: marta, cuerpo: { id_estado: 6 } });
  comprobar('Resuelta exige comentario (400)', sinComentario.status === 400);
  for (const [token, idEstado, comentario] of [
    [marta, 6, 'Lampara nueva, enciende bien.'],
    [luis, 7, null],
    [luis, 8, null],
  ]) {
    const r = await pedir('PATCH', `/incidencias/${id}/estado`, { token, cuerpo: { id_estado: idEstado, comentario } });
    comprobar(`pasa al estado ${idEstado}`, r.status === 200 && r.datos.estado.id_estado === idEstado, r.status);
  }
  const cerrada = await pedir('PATCH', `/incidencias/${id}/estado`, { token: luis, cuerpo: { id_estado: 5, comentario: 'Reabrir.' } });
  comprobar('una incidencia Cerrada no cambia mas (409)', cerrada.status === 409);
  const cerradaPrioridad = await pedir('PATCH', `/incidencias/${id}/clasificacion`, { token: luis, cuerpo: { prioridad: 'baja' } });
  comprobar('ni de prioridad (409)', cerradaPrioridad.status === 409);

  console.log('\nTrazabilidad e historial de fallas (RF2, RF6)');
  const historial = await pedir('GET', `/incidencias/${id}/historial`, { token: ana });
  comprobar('el historial tiene los 8 estados en orden', historial.datos.map((h) => h.estado.id_estado).join() === '1,2,3,4,5,6,7,8');
  comprobar('el primer registro no tiene estado anterior', historial.datos[0].estado_anterior === null);
  comprobar('cada registro guarda el comentario del cambio', historial.datos[5].comentario === 'Lampara nueva, enciende bien.');
  const fallasProyector = await pedir('GET', `/activos/${ID_PROYECTOR}/historial-fallas`, { token: ana });
  const resumen = fallasProyector.datos.fallas.find((f) => f.id_incidencia === id);
  comprobar('el historial de fallas del proyector la incluye con fecha_cierre', Boolean(resumen?.fecha_cierre));
  comprobar('los totales del historial de fallas cuadran', fallasProyector.datos.total_fallas >= 3 && fallasProyector.datos.fallas_abiertas >= 1);
  const avisosAna = await pedir('GET', '/notificaciones', { token: ana });
  comprobar('el reportante recibe un cambio_estado por cada cambio', avisosAna.datos.filter((n) => n.id_incidencia === id && n.tipo === 'cambio_estado').length === 7);

  console.log('\nDispositivos (RF8)');
  const nuevo = await pedir('POST', '/dispositivos', { token: marta, cuerpo: { token_expo: TOKEN_PRUEBA, plataforma: 'android' } });
  comprobar('registra el dispositivo (201)', nuevo.status === 201);
  const mismo = await pedir('POST', '/dispositivos', { token: marta, cuerpo: { token_expo: TOKEN_PRUEBA, plataforma: 'android' } });
  comprobar('el mismo token responde 200 con el mismo id', mismo.status === 200 && mismo.datos.id_dispositivo === nuevo.datos.id_dispositivo);
  const malo = await pedir('POST', '/dispositivos', { token: marta, cuerpo: { token_expo: 'abc', plataforma: 'web' } });
  comprobar('rechaza token o plataforma invalidos (400)', malo.status === 400);
  const baja = await pedir('DELETE', `/dispositivos/${nuevo.datos.id_dispositivo}`, { token: marta });
  comprobar('lo da de baja (204)', baja.status === 204);
  const bajaRepetida = await pedir('DELETE', `/dispositivos/${nuevo.datos.id_dispositivo}`, { token: marta });
  comprobar('una segunda baja responde 404', bajaRepetida.status === 404);

  console.log(`\n${fallas === 0 ? 'Todo OK' : `${fallas} comprobaciones fallaron`}`);
  process.exitCode = fallas === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});