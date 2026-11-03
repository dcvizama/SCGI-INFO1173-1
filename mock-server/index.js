// Servidor mock del contrato SCGI v1.2.0.
// Responde con la forma exacta del contrato para que la app movil pueda
// trabajar mientras TI2 termina el backend real. Es temporal y desechable.

const { randomUUID } = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  usuarios,
  activos,
  estadosIncidencia,
  tiposEvidencia,
  incidencias,
  evidencias,
} = require('./datos-semilla');

const app = express();
const PUERTO = process.env.PORT || 3000;
const CLAVE_JWT = process.env.JWT_SECRET || 'clave-de-prueba-scgi';
const DURACION_TOKEN = '8h';
const BASE = '/api/v1';

// Reglas del contrato v1.2.0 para incidencias y evidencias.
const PRIORIDADES = ['baja', 'media', 'alta'];
const MAX_TITULO = 100;
const MAX_DESCRIPCION = 1000;
const MAX_EVIDENCIAS = 5;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function evidenciasDe(idIncidencia) {
  return evidencias.filter((e) => e.id_incidencia === idIncidencia);
}

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
    contrato: '1.2.0',
    rutas: [
      `POST ${BASE}/autenticacion/inicio-sesion`,
      `GET ${BASE}/autenticacion/usuario-actual`,
      `GET ${BASE}/activos?busqueda=texto&limite=20`,
      `GET ${BASE}/activos/codigo-qr/:codigo_qr`,
      `GET ${BASE}/activos/:id_activo`,
      `GET ${BASE}/incidencias?id_activo=&id_estado=&limite=20`,
      `POST ${BASE}/incidencias`,
      `GET ${BASE}/incidencias/:id_incidencia`,
      `GET ${BASE}/incidencias/:id_incidencia/evidencias`,
      `POST ${BASE}/incidencias/:id_incidencia/evidencias`,
      `GET ${BASE}/estados-incidencia`,
      `GET ${BASE}/tipos-evidencia`,
    ],
  });
});

// ------------------------------------------------------------------
// Autenticacion
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

// ------------------------------------------------------------------
// Activos
// ------------------------------------------------------------------

app.get(`${BASE}/activos`, exigirSesion, (req, res) => {
  const busqueda = String(req.query.busqueda || '').trim();
  const limite = Number(req.query.limite || 20);

  if (!busqueda) {
    return responderError(req, res, 400, 'Debes enviar el texto a buscar.');
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > 50) {
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

// ------------------------------------------------------------------
// Incidencias (RF3) y evidencias (RF4)
// ------------------------------------------------------------------

app.get(`${BASE}/incidencias`, exigirSesion, (req, res) => {
  const { id_activo, id_estado } = req.query;
  const limite = Number(req.query.limite || 20);

  if (id_activo && !UUID.test(id_activo)) {
    return responderError(req, res, 400, 'El identificador del activo no es valido.');
  }

  if (id_estado && !Number.isInteger(Number(id_estado))) {
    return responderError(req, res, 400, 'El estado debe ser un numero.');
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > 50) {
    return responderError(req, res, 400, 'El limite debe ser un numero entre 1 y 50.');
  }

  const encontradas = incidencias
    .filter((i) => !id_activo || i.id_activo === id_activo)
    .filter((i) => !id_estado || i.estado.id_estado === Number(id_estado))
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
    return responderError(req, res, 400, 'La prioridad debe ser baja, media o alta.');
  }

  if (!activos.some((a) => a.id_activo === id_activo)) {
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
    fecha_creacion: new Date().toISOString(),
  };

  incidencias.push(incidencia);

  return res.status(201).json(incidencia);
});

app.get(`${BASE}/incidencias/:id_incidencia`, exigirSesion, cargarIncidencia, (req, res) => {
  res.json({ ...req.incidencia, evidencias: evidenciasDe(req.incidencia.id_incidencia) });
});

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

app.get(`${BASE}/estados-incidencia`, exigirSesion, (req, res) => {
  res.json(estadosIncidencia);
});

app.get(`${BASE}/tipos-evidencia`, exigirSesion, (req, res) => {
  res.json(tiposEvidencia);
});

// Cualquier otra ruta responde con el mismo formato de error.
app.use((req, res) => responderError(req, res, 404, 'La ruta no existe.'));

app.listen(PUERTO, () => {
  console.log(`Servidor mock SCGI escuchando en el puerto ${PUERTO}`);
});