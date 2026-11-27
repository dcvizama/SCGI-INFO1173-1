// Servidor mock del contrato SCGI v1.3.0, con los acuerdos de TI2 del Sprint 3
// (prioridad critica, clasificar una incidencia ya avanzada y asignar sin
// clasificar), que entran al contrato en la v1.4.0.
// Responde con la forma exacta del contrato para que la app movil pueda
// trabajar mientras TI2 termina el backend real. Es temporal y desechable.

const { randomUUID } = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  usuarios,
  activos,
  estadosIncidencia,
  transicionesEstado,
  tiposEvidencia,
  incidencias,
  historialEstados,
  evidencias,
  ordenesTrabajo,
  notificaciones,
  dispositivos,
} = require('./datos-semilla');

const app = express();
const PUERTO = process.env.PORT || 3000;
const CLAVE_JWT = process.env.JWT_SECRET || 'clave-de-prueba-scgi';
const DURACION_TOKEN = '8h';
const BASE = '/api/v1';
const CONTRATO = '1.3.0';

// Reglas del contrato para incidencias, evidencias, ciclo de vida y notificaciones.
const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];
const ROLES = ['REPORTANTE', 'SUPERVISOR', 'TECNICO', 'ADMINISTRADOR'];
const PLATAFORMAS = ['android', 'ios'];
const MAX_TITULO = 100;
const MAX_DESCRIPCION = 1000;
const MAX_COMENTARIO = 500;
const MAX_EVIDENCIAS = 5;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_EXPO = /^Expo(nent)?PushToken\[.+\]$/;

// Estados con ruta propia: no se alcanzan con PATCH .../estado.
const PENDIENTE_REVISION = 1;
const CLASIFICADA = 2;
const ASIGNADA = 3;

app.use(express.json());

// Formato de error acordado con TI2: mensaje para el usuario y metadatos
// para el monitoreo.
function responderError(req, res, statusCode, mensaje) {
  return res.status(statusCode).json({
    statusCode,
    mensaje,
    message: mensaje,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

function sinContrasena(usuario) {
  const { contrasena, ...publico } = usuario;

  return publico;
}

function esTextoConContenido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esUrlHttps(valor) {
  try {
    return new URL(valor).protocol === 'https:';
  } catch {
    return false;
  }
}

function leerLimite(req) {
  const limite = Number(req.query.limite || 20);

  return Number.isInteger(limite) && limite >= 1 && limite <= 50 ? limite : null;
}

function evidenciasDe(idIncidencia) {
  return evidencias.filter((e) => e.id_incidencia === idIncidencia);
}

function historialDe(idIncidencia) {
  return historialEstados
    .filter((h) => h.id_incidencia === idIncidencia)
    .sort((a, b) => a.fecha_creacion.localeCompare(b.fecha_creacion));
}

function estadoPorId(idEstado) {
  return estadosIncidencia.find((e) => e.id_estado === idEstado);
}

// Comentario opcional del historial. Devuelve { comentario } o { error }.
function leerComentario(valor) {
  if (valor === undefined || valor === null || valor === '') return { comentario: null };

  if (typeof valor !== 'string' || !valor.trim()) {
    return { error: 'El comentario no puede estar vacio.' };
  }

  if (valor.trim().length > MAX_COMENTARIO) {
    return { error: `El comentario admite como maximo ${MAX_COMENTARIO} caracteres.` };
  }

  return { comentario: valor.trim() };
}

// ------------------------------------------------------------------
// Notificaciones automaticas (RF8)
// ------------------------------------------------------------------

// Envia la push por el servicio de Expo a los dispositivos del usuario.
// Es de mejor esfuerzo: si falla, la notificacion igual queda guardada.
function enviarPush(notificacion) {
  const destinos = dispositivos.filter((d) => d.id_usuario === notificacion.id_usuario_destino);

  if (destinos.length === 0 || typeof fetch !== 'function') return;

  const mensajes = destinos.map((d) => ({
    to: d.token_expo,
    title: notificacion.titulo,
    body: notificacion.mensaje,
    data: {
      id_notificacion: notificacion.id_notificacion,
      id_incidencia: notificacion.id_incidencia,
      tipo: notificacion.tipo,
    },
  }));

  fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(mensajes),
  }).catch((error) => console.warn(`[push] no se pudo enviar: ${error.message}`));
}

function notificar(idUsuarioDestino, tipo, titulo, mensaje, idIncidencia) {
  const notificacion = {
    id_notificacion: randomUUID(),
    id_usuario_destino: idUsuarioDestino,
    id_incidencia: idIncidencia,
    tipo,
    titulo,
    mensaje,
    leida: false,
    fecha_creacion: new Date().toISOString(),
    fecha_lectura: null,
  };

  notificaciones.push(notificacion);
  enviarPush(notificacion);

  return notificacion;
}

// Cambia el estado de la incidencia, lo deja en el historial (RF6) y avisa
// al reportante si el cambio lo hizo otra persona (RF8).
function registrarCambio(incidencia, idEstado, idUsuario, comentario) {
  const nuevo = estadoPorId(idEstado);

  historialEstados.push({
    id_historial: randomUUID(),
    id_incidencia: incidencia.id_incidencia,
    estado_anterior: incidencia.estado,
    estado: nuevo,
    id_usuario_cambio: idUsuario,
    comentario,
    fecha_creacion: new Date().toISOString(),
  });

  incidencia.estado = nuevo;

  if (incidencia.id_reportante !== idUsuario) {
    notificar(
      incidencia.id_reportante,
      'cambio_estado',
      'Tu reporte cambio de estado',
      `"${incidencia.titulo}" paso a ${nuevo.nombre_estado}.`,
      incidencia.id_incidencia
    );
  }
}

// ------------------------------------------------------------------
// Middlewares
// ------------------------------------------------------------------

// Comprueba el token y deja el usuario en req.usuario.
function exigirSesion(req, res, siguiente) {
  const cabecera = req.headers.authorization || '';

  if (!cabecera.startsWith('Bearer ')) {
    return responderError(req, res, 401, 'Falta el token de sesion.');
  }

  try {
    const contenido = jwt.verify(cabecera.slice(7), CLAVE_JWT);
    const usuario = usuarios.find((u) => u.id_usuario === contenido.sub);

    if (!usuario) {
      return responderError(req, res, 401, 'El usuario del token ya no existe.');
    }

    req.usuario = usuario;

    return siguiente();
  } catch {
    return responderError(req, res, 401, 'El token no es valido o expiro.');
  }
}

// Deja pasar solo a los roles indicados (403 para el resto).
function exigirRol(...roles) {
  return (req, res, siguiente) => {
    if (!roles.includes(req.usuario.rol.nombre_rol)) {
      return responderError(req, res, 403, 'Tu rol no permite esta accion.');
    }

    return siguiente();
  };
}

// Busca la incidencia de la ruta y la deja en req.incidencia.
function cargarIncidencia(req, res, siguiente) {
  const { id_incidencia } = req.params;

  if (!UUID.test(id_incidencia)) {
    return responderError(req, res, 400, 'El identificador de la incidencia no es valido.');
  }

  const incidencia = incidencias.find((i) => i.id_incidencia === id_incidencia);

  if (!incidencia) {
    return responderError(req, res, 404, 'La incidencia no existe.');
  }

  req.incidencia = incidencia;

  return siguiente();
}

// Pagina de inicio: sirve para comprobar que el servicio esta arriba (RNF2).
app.get('/', (req, res) => {
  res.json({
    servicio: 'SCGI API (mock)',
    contrato: CONTRATO,
    rutas: [
      `POST ${BASE}/autenticacion/inicio-sesion`,
      `GET ${BASE}/autenticacion/usuario-actual`,
      `GET ${BASE}/usuarios?rol=TECNICO`,
      `GET ${BASE}/activos?busqueda=texto&limite=20`,
      `GET ${BASE}/activos/codigo-qr/:codigo_qr`,
      `GET ${BASE}/activos/:id_activo`,
      `GET ${BASE}/activos/:id_activo/historial-fallas`,
      `GET ${BASE}/incidencias?id_activo=&id_estado=&prioridad=&limite=20`,
      `POST ${BASE}/incidencias`,
      `GET ${BASE}/incidencias/:id_incidencia`,
      `PATCH ${BASE}/incidencias/:id_incidencia/clasificacion`,
      `PATCH ${BASE}/incidencias/:id_incidencia/estado`,
      `GET ${BASE}/incidencias/:id_incidencia/historial`,
      `GET ${BASE}/incidencias/:id_incidencia/evidencias`,
      `POST ${BASE}/incidencias/:id_incidencia/evidencias`,
      `GET ${BASE}/ordenes-trabajo?id_incidencia=&id_tecnico=`,
      `POST ${BASE}/ordenes-trabajo`,
      `GET ${BASE}/estados-incidencia`,
      `GET ${BASE}/estados-incidencia/transiciones?id_estado_origen=`,
      `GET ${BASE}/tipos-evidencia`,
      `GET ${BASE}/notificaciones?leida=&limite=20`,
      `PATCH ${BASE}/notificaciones/:id_notificacion/leida`,
      `POST ${BASE}/dispositivos`,
      `DELETE ${BASE}/dispositivos/:id_dispositivo`,
    ],
  });
});

// ------------------------------------------------------------------
// Autenticacion y usuarios
// ------------------------------------------------------------------

app.post(`${BASE}/autenticacion/inicio-sesion`, (req, res) => {
  const { correo, contrasena } = req.body || {};

  if (!correo || !contrasena) {
    return responderError(req, res, 400, 'Debes enviar correo y contrasena.');
  }

  const usuario = usuarios.find(
    (u) => u.correo.toLowerCase() === String(correo).toLowerCase()
  );

  if (!usuario || usuario.contrasena !== contrasena) {
    return responderError(req, res, 401, 'Correo o contrasena incorrectos.');
  }

  const token = jwt.sign(
    { sub: usuario.id_usuario, rol: usuario.rol.nombre_rol },
    CLAVE_JWT,
    { expiresIn: DURACION_TOKEN }
  );

  return res.json({ token, usuario: sinContrasena(usuario) });
});

app.get(`${BASE}/autenticacion/usuario-actual`, exigirSesion, (req, res) => {
  res.json(sinContrasena(req.usuario));
});

// Selector de tecnico al asignar (RF5).
app.get(
  `${BASE}/usuarios`,
  exigirSesion,
  exigirRol('SUPERVISOR', 'ADMINISTRADOR'),
  (req, res) => {
    const { rol } = req.query;

    if (rol && !ROLES.includes(rol)) {
      return responderError(req, res, 400, 'El rol no existe.');
    }

    const encontrados = usuarios
      .filter((u) => !rol || u.rol.nombre_rol === rol)
      .sort((a, b) => a.apellido.localeCompare(b.apellido))
      .map(sinContrasena);

    return res.json(encontrados);
  }
);

// ------------------------------------------------------------------
// Activos
// ------------------------------------------------------------------

app.get(`${BASE}/activos`, exigirSesion, (req, res) => {
  const busqueda = String(req.query.busqueda || '').trim();
  const limite = leerLimite(req);

  if (!busqueda) {
    return responderError(req, res, 400, 'Debes enviar el texto a buscar.');
  }

  if (!limite) {
    return responderError(req, res, 400, 'El limite debe ser un numero entre 1 y 50.');
  }

  const texto = busqueda.toLowerCase();
  const encontrados = activos.filter(
    (activo) =>
      activo.nombre.toLowerCase().includes(texto) ||
      activo.codigo_qr.toLowerCase().includes(texto)
  );

  return res.json(encontrados.slice(0, limite));
});

app.get(`${BASE}/activos/codigo-qr/:codigo_qr`, exigirSesion, (req, res) => {
  const activo = activos.find((a) => a.codigo_qr === req.params.codigo_qr);

  if (!activo) {
    return responderError(req, res, 404, 'Ningun activo tiene ese codigo QR.');
  }

  return res.json(activo);
});

app.get(`${BASE}/activos/:id_activo`, exigirSesion, (req, res) => {
  const activo = activos.find((a) => a.id_activo === req.params.id_activo);

  if (!activo) {
    return responderError(req, res, 404, 'El activo no existe.');
  }

  return res.json(activo);
});

// Historial de fallas de un activo (RF2, RF6), de la mas reciente a la mas antigua.
app.get(`${BASE}/activos/:id_activo/historial-fallas`, exigirSesion, (req, res) => {
  const { id_activo } = req.params;
  const limite = leerLimite(req);

  if (!UUID.test(id_activo)) {
    return responderError(req, res, 400, 'El identificador del activo no es valido.');
  }

  if (!limite) {
    return responderError(req, res, 400, 'El limite debe ser un numero entre 1 y 50.');
  }

  if (!activos.some((a) => a.id_activo === id_activo)) {
    return responderError(req, res, 404, 'El activo no existe.');
  }

  const fallas = incidencias
    .filter((i) => i.id_activo === id_activo)
    .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion))
    .map((i) => {
      const cierre = historialDe(i.id_incidencia).find((h) => h.estado.es_final);

      return {
        id_incidencia: i.id_incidencia,
        titulo: i.titulo,
        prioridad: i.prioridad,
        estado: i.estado,
        fecha_creacion: i.fecha_creacion,
        fecha_cierre: cierre ? cierre.fecha_creacion : null,
      };
    });

  return res.json({
    id_activo,
    total_fallas: fallas.length,
    fallas_abiertas: fallas.filter((f) => !f.estado.es_final).length,
    fallas: fallas.slice(0, limite),
  });
});

// ------------------------------------------------------------------
// Incidencias (RF3), ciclo de vida (RF5, RF6) y evidencias (RF4)
// ------------------------------------------------------------------

app.get(`${BASE}/incidencias`, exigirSesion, (req, res) => {
  const { id_activo, id_estado, prioridad } = req.query;
  const limite = leerLimite(req);

  if (id_activo && !UUID.test(id_activo)) {
    return responderError(req, res, 400, 'El identificador del activo no es valido.');
  }

  if (id_estado && !Number.isInteger(Number(id_estado))) {
    return responderError(req, res, 400, 'El estado debe ser un numero.');
  }

  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    return responderError(req, res, 400, 'La prioridad debe ser baja, media, alta o critica.');
  }

  if (!limite) {
    return responderError(req, res, 400, 'El limite debe ser un numero entre 1 y 50.');
  }

  const encontradas = incidencias
    .filter((i) => !id_activo || i.id_activo === id_activo)
    .filter((i) => !id_estado || i.estado.id_estado === Number(id_estado))
    .filter((i) => !prioridad || i.prioridad === prioridad)
    .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));

  return res.json(encontradas.slice(0, limite));
});

app.post(`${BASE}/incidencias`, exigirSesion, (req, res) => {
  const { id_activo, titulo, descripcion, prioridad = 'media' } = req.body || {};

  if (!id_activo || !esTextoConContenido(titulo) || !esTextoConContenido(descripcion)) {
    return responderError(req, res, 400, 'Debes enviar id_activo, titulo y descripcion.');
  }

  if (!UUID.test(id_activo)) {
    return responderError(req, res, 400, 'El identificador del activo no es valido.');
  }

  if (titulo.trim().length > MAX_TITULO) {
    return responderError(req, res, 400, `El titulo admite como maximo ${MAX_TITULO} caracteres.`);
  }

  if (descripcion.trim().length > MAX_DESCRIPCION) {
    return responderError(
      req,
      res,
      400,
      `La descripcion admite como maximo ${MAX_DESCRIPCION} caracteres.`
    );
  }

  if (!PRIORIDADES.includes(prioridad)) {
    return responderError(req, res, 400, 'La prioridad debe ser baja, media, alta o critica.');
  }

  const activo = activos.find((a) => a.id_activo === id_activo);

  if (!activo) {
    return responderError(req, res, 404, 'El activo no existe.');
  }

  // El reportante sale del token y la incidencia nace en el primer estado.
  const incidencia = {
    id_incidencia: randomUUID(),
    id_activo,
    id_reportante: req.usuario.id_usuario,
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    prioridad,
    estado: estadosIncidencia[0],
    id_tecnico_asignado: null,
    fecha_creacion: new Date().toISOString(),
  };

  incidencias.push(incidencia);
  historialEstados.push({
    id_historial: randomUUID(),
    id_incidencia: incidencia.id_incidencia,
    estado_anterior: null,
    estado: incidencia.estado,
    id_usuario_cambio: req.usuario.id_usuario,
    comentario: null,
    fecha_creacion: incidencia.fecha_creacion,
  });

  usuarios
    .filter((u) => u.rol.nombre_rol === 'SUPERVISOR')
    .forEach((supervisor) =>
      notificar(
        supervisor.id_usuario,
        'nueva_incidencia',
        'Nueva incidencia por revisar',
        `"${incidencia.titulo}" en ${activo.ubicacion.nombre_espacio} espera clasificacion.`,
        incidencia.id_incidencia
      )
    );

  return res.status(201).json(incidencia);
});

app.get(`${BASE}/incidencias/:id_incidencia`, exigirSesion, cargarIncidencia, (req, res) => {
  res.json({ ...req.incidencia, evidencias: evidenciasDe(req.incidencia.id_incidencia) });
});

// El supervisor fija la prioridad (RF5). Si la incidencia esta pendiente de
// revision pasa a Clasificada; si ya avanzo, solo cambia la prioridad (en TI2 es
// alias de PATCH .../prioridad). Una incidencia cerrada ya no cambia.
app.patch(
  `${BASE}/incidencias/:id_incidencia/clasificacion`,
  exigirSesion,
  exigirRol('SUPERVISOR'),
  cargarIncidencia,
  (req, res) => {
    const { prioridad, comentario } = req.body || {};
    const lectura = leerComentario(comentario);

    if (!PRIORIDADES.includes(prioridad)) {
      return responderError(req, res, 400, 'La prioridad debe ser baja, media, alta o critica.');
    }

    if (lectura.error) {
      return responderError(req, res, 400, lectura.error);
    }

    if (req.incidencia.estado.es_final) {
      return responderError(req, res, 409, 'Una incidencia cerrada no cambia de prioridad.');
    }

    req.incidencia.prioridad = prioridad;

    if (req.incidencia.estado.id_estado === PENDIENTE_REVISION) {
      registrarCambio(req.incidencia, CLASIFICADA, req.usuario.id_usuario, lectura.comentario);
    }

    return res.json(req.incidencia);
  }
);

// Cambio de estado segun la matriz de transiciones (RF6).
app.patch(
  `${BASE}/incidencias/:id_incidencia/estado`,
  exigirSesion,
  cargarIncidencia,
  (req, res) => {
    const { id_estado, comentario } = req.body || {};
    const destino = estadoPorId(Number(id_estado));
    const lectura = leerComentario(comentario);
    const { incidencia, usuario } = req;

    if (!Number.isInteger(id_estado) || !destino) {
      return responderError(req, res, 400, 'El estado de destino no existe.');
    }

    if (lectura.error) {
      return responderError(req, res, 400, lectura.error);
    }

    if (id_estado === CLASIFICADA || id_estado === ASIGNADA) {
      return responderError(
        req,
        res,
        409,
        'Para clasificar o asignar se usan sus propias rutas.'
      );
    }

    const transicion = transicionesEstado.find(
      (t) => t.id_estado_origen === incidencia.estado.id_estado && t.id_estado_destino === id_estado
    );

    if (!transicion) {
      return responderError(
        req,
        res,
        409,
        `No se puede pasar de ${incidencia.estado.nombre_estado} a ${destino.nombre_estado}.`
      );
    }

    if (!transicion.roles_permitidos.includes(usuario.rol.nombre_rol)) {
      return responderError(req, res, 403, 'Tu rol no puede hacer este cambio de estado.');
    }

    if (usuario.rol.nombre_rol === 'TECNICO' && incidencia.id_tecnico_asignado !== usuario.id_usuario) {
      return responderError(req, res, 403, 'Solo el tecnico asignado puede avanzar la incidencia.');
    }

    if (transicion.requiere_comentario && !lectura.comentario) {
      return responderError(req, res, 400, 'Este cambio de estado exige un comentario.');
    }

    registrarCambio(incidencia, id_estado, usuario.id_usuario, lectura.comentario);

    return res.json(incidencia);
  }
);

// Trazabilidad (RF6), del cambio mas antiguo al mas reciente.
app.get(
  `${BASE}/incidencias/:id_incidencia/historial`,
  exigirSesion,
  cargarIncidencia,
  (req, res) => {
    res.json(historialDe(req.incidencia.id_incidencia));
  }
);

app.get(
  `${BASE}/incidencias/:id_incidencia/evidencias`,
  exigirSesion,
  cargarIncidencia,
  (req, res) => {
    res.json(evidenciasDe(req.incidencia.id_incidencia));
  }
);

app.post(
  `${BASE}/incidencias/:id_incidencia/evidencias`,
  exigirSesion,
  cargarIncidencia,
  (req, res) => {
    const { id_tipo_evidencia, url_evidencia } = req.body || {};
    const tipo = tiposEvidencia.find((t) => t.id_tipo_evidencia === Number(id_tipo_evidencia));

    if (!esUrlHttps(url_evidencia)) {
      return responderError(req, res, 400, 'url_evidencia debe ser una direccion https valida.');
    }

    if (!tipo) {
      return responderError(req, res, 400, 'El tipo de evidencia no existe.');
    }

    if (evidenciasDe(req.incidencia.id_incidencia).length >= MAX_EVIDENCIAS) {
      return responderError(
        req,
        res,
        409,
        `La incidencia ya tiene el maximo de ${MAX_EVIDENCIAS} evidencias.`
      );
    }

    const evidencia = {
      id_evidencia: randomUUID(),
      id_incidencia: req.incidencia.id_incidencia,
      tipo,
      url_evidencia,
      fecha_creacion: new Date().toISOString(),
    };

    evidencias.push(evidencia);

    return res.status(201).json(evidencia);
  }
);

// ------------------------------------------------------------------
// Ordenes de trabajo: asignacion del tecnico (RF5)
// ------------------------------------------------------------------

app.get(`${BASE}/ordenes-trabajo`, exigirSesion, (req, res) => {
  const { id_incidencia, id_tecnico } = req.query;

  if ((id_incidencia && !UUID.test(id_incidencia)) || (id_tecnico && !UUID.test(id_tecnico))) {
    return responderError(req, res, 400, 'Los identificadores deben ser UUID.');
  }

  const encontradas = ordenesTrabajo
    .filter((o) => !id_incidencia || o.id_incidencia === id_incidencia)
    .filter((o) => !id_tecnico || o.id_tecnico === id_tecnico);

  return res.json(encontradas);
});

app.post(`${BASE}/ordenes-trabajo`, exigirSesion, exigirRol('SUPERVISOR'), (req, res) => {
  const { id_incidencia, id_tecnico } = req.body || {};

  if (!UUID.test(id_incidencia || '') || !UUID.test(id_tecnico || '')) {
    return responderError(req, res, 400, 'Debes enviar id_incidencia e id_tecnico validos.');
  }

  const incidencia = incidencias.find((i) => i.id_incidencia === id_incidencia);
  const tecnico = usuarios.find(
    (u) => u.id_usuario === id_tecnico && u.rol.nombre_rol === 'TECNICO'
  );

  if (!incidencia || !tecnico) {
    return responderError(req, res, 404, 'La incidencia o el tecnico no existen.');
  }

  // Se puede asignar sin clasificar antes (acuerdo con TI2).
  const asignable = [PENDIENTE_REVISION, CLASIFICADA].includes(incidencia.estado.id_estado);

  if (!asignable || ordenesTrabajo.some((o) => o.id_incidencia === id_incidencia)) {
    return responderError(
      req,
      res,
      409,
      'Solo se asignan incidencias pendientes o clasificadas y sin orden vigente.'
    );
  }

  const orden = {
    id_orden: randomUUID(),
    id_incidencia,
    id_tecnico,
    diagnostico_tecnico: null,
    fecha_creacion: new Date().toISOString(),
  };

  ordenesTrabajo.push(orden);
  incidencia.id_tecnico_asignado = id_tecnico;
  registrarCambio(incidencia, ASIGNADA, req.usuario.id_usuario, null);

  const activo = activos.find((a) => a.id_activo === incidencia.id_activo);
  notificar(
    id_tecnico,
    'incidencia_asignada',
    'Nueva incidencia asignada',
    `Se te asigno "${incidencia.titulo}" en ${activo ? activo.ubicacion.nombre_espacio : 'el activo'}.`,
    id_incidencia
  );

  return res.status(201).json(orden);
});

// ------------------------------------------------------------------
// Catalogos
// ------------------------------------------------------------------

app.get(`${BASE}/estados-incidencia`, exigirSesion, (req, res) => {
  res.json(estadosIncidencia);
});

app.get(`${BASE}/estados-incidencia/transiciones`, exigirSesion, (req, res) => {
  const { id_estado_origen } = req.query;

  if (id_estado_origen && !Number.isInteger(Number(id_estado_origen))) {
    return responderError(req, res, 400, 'El estado de origen debe ser un numero.');
  }

  return res.json(
    transicionesEstado.filter(
      (t) => !id_estado_origen || t.id_estado_origen === Number(id_estado_origen)
    )
  );
});

app.get(`${BASE}/tipos-evidencia`, exigirSesion, (req, res) => {
  res.json(tiposEvidencia);
});

// ------------------------------------------------------------------
// Notificaciones y dispositivos (RF8)
// ------------------------------------------------------------------

app.get(`${BASE}/notificaciones`, exigirSesion, (req, res) => {
  const { leida } = req.query;
  const limite = leerLimite(req);

  if (leida !== undefined && leida !== 'true' && leida !== 'false') {
    return responderError(req, res, 400, 'leida debe ser true o false.');
  }

  if (!limite) {
    return responderError(req, res, 400, 'El limite debe ser un numero entre 1 y 50.');
  }

  const propias = notificaciones
    .filter((n) => n.id_usuario_destino === req.usuario.id_usuario)
    .filter((n) => leida === undefined || n.leida === (leida === 'true'))
    .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));

  return res.json(propias.slice(0, limite));
});

app.patch(`${BASE}/notificaciones/:id_notificacion/leida`, exigirSesion, (req, res) => {
  const { id_notificacion } = req.params;

  if (!UUID.test(id_notificacion)) {
    return responderError(req, res, 400, 'El identificador de la notificacion no es valido.');
  }

  // Si es de otro usuario responde 404, para no revelar que existe.
  const notificacion = notificaciones.find(
    (n) => n.id_notificacion === id_notificacion && n.id_usuario_destino === req.usuario.id_usuario
  );

  if (!notificacion) {
    return responderError(req, res, 404, 'La notificacion no existe.');
  }

  if (!notificacion.leida) {
    notificacion.leida = true;
    notificacion.fecha_lectura = new Date().toISOString();
  }

  return res.json(notificacion);
});

app.post(`${BASE}/dispositivos`, exigirSesion, (req, res) => {
  const { token_expo, plataforma } = req.body || {};

  if (!TOKEN_EXPO.test(token_expo || '') || !PLATAFORMAS.includes(plataforma)) {
    return responderError(req, res, 400, 'Debes enviar un token de Expo y la plataforma.');
  }

  const existente = dispositivos.find((d) => d.token_expo === token_expo);

  // Mismo telefono: queda asociado al usuario que inicio sesion ahora.
  if (existente) {
    existente.id_usuario = req.usuario.id_usuario;
    existente.plataforma = plataforma;

    return res.status(200).json(existente);
  }

  const dispositivo = {
    id_dispositivo: randomUUID(),
    id_usuario: req.usuario.id_usuario,
    token_expo,
    plataforma,
    fecha_creacion: new Date().toISOString(),
  };

  dispositivos.push(dispositivo);

  return res.status(201).json(dispositivo);
});

app.delete(`${BASE}/dispositivos/:id_dispositivo`, exigirSesion, (req, res) => {
  const { id_dispositivo } = req.params;

  if (!UUID.test(id_dispositivo)) {
    return responderError(req, res, 400, 'El identificador del dispositivo no es valido.');
  }

  const indice = dispositivos.findIndex(
    (d) => d.id_dispositivo === id_dispositivo && d.id_usuario === req.usuario.id_usuario
  );

  if (indice === -1) {
    return responderError(req, res, 404, 'El dispositivo no existe.');
  }

  dispositivos.splice(indice, 1);

  return res.status(204).end();
});

// Cualquier otra ruta responde con el mismo formato de error.
app.use((req, res) => responderError(req, res, 404, 'La ruta no existe.'));

app.listen(PUERTO, () => {
  console.log(`Servidor mock SCGI (contrato ${CONTRATO}) escuchando en el puerto ${PUERTO}`);
});