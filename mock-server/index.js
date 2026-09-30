// Servidor mock del contrato SCGI v1.1.0.
// Responde con la forma exacta del contrato para que la app movil pueda
// trabajar mientras TI2 termina el backend real. Es temporal y desechable.

const express = require('express');
const jwt = require('jsonwebtoken');
const { usuarios, activos } = require('./datos-semilla');

const app = express();
const PUERTO = process.env.PORT || 3000;
const CLAVE_JWT = process.env.JWT_SECRET || 'clave-de-prueba-scgi';
const DURACION_TOKEN = '8h';
const BASE = '/api/v1';

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

// Pagina de inicio: sirve para comprobar que el servicio esta arriba (RNF2).
app.get('/', (req, res) => {
  res.json({
    servicio: 'SCGI API (mock)',
    contrato: '1.1.0',
    rutas: [
      `POST ${BASE}/autenticacion/inicio-sesion`,
      `GET ${BASE}/autenticacion/usuario-actual`,
      `GET ${BASE}/activos?busqueda=texto&limite=20`,
      `GET ${BASE}/activos/codigo-qr/:codigo_qr`,
      `GET ${BASE}/activos/:id_activo`,
    ],
  });
});

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

// Cualquier otra ruta responde con el mismo formato de error.
app.use((req, res) => responderError(req, res, 404, 'La ruta no existe.'));

app.listen(PUERTO, () => {
  console.log(`Servidor mock SCGI escuchando en el puerto ${PUERTO}`);
});