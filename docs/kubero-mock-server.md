# Servidor mock en Kubero

El `mock-server` se despliega como contenedor en Kubero (kubero.inf.uct.cl), la
plataforma que pide el ramo. Así la app usa una URL HTTPS estable para las
pruebas en el teléfono, en vez del servidor local o Render.

Dirección: https://scgi-api.inf.uct.cl (la API está en `/api/v1`). Al abrir la
raíz responde un JSON con `"servicio": "SCGI API (mock)"` y la lista de rutas.

## Cómo funciona

El workflow `.github/workflows/mock-server-kubero.yml` se ejecuta con cada push
a `main` que cambie `mock-server/`, o a mano desde Actions:

1. Construye la imagen con `mock-server/Dockerfile`.
2. La publica en `ghcr.io/dcvizama/scgi-mock-server:latest` (paquete público).
3. Le pide a Kubero que reinicie la app, para que descargue la imagen nueva.

GitHub solo muestra el botón "Run workflow" de los workflows que están en la
rama por defecto (`main`).

## Configuración actual

### En Kubero

Pipeline `scgi` (equipo `integra_II_IV_grupo7`), fase Producción, app
`mock-server`:

| Campo | Valor |
|---|---|
| Imagen | `ghcr.io/dcvizama/scgi-mock-server` |
| Etiqueta | `latest` |
| Puerto | `3000` |
| Dominio | `scgi-api.inf.uct.cl`, con SSL |
| Variable `JWT_SECRET` | Clave propia del mock (no es la de ejemplo del código) |

`JWT_SECRET` solo la usa el mock para firmar y validar sus propios tokens; la
app móvil no la necesita.

### En GitHub

En Settings → Secrets and variables → Actions:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `KUBERO_TOKEN` | Token de la API de Kubero (Perfil → Tokens de API) |
| Variable | `KUBERO_PIPELINE` | `scgi` |
| Variable | `KUBERO_PHASE` | `production` |
| Variable | `KUBERO_APP` | `mock-server` |
| Variable opcional | `KUBERO_URL` | Solo si Kubero no está en `https://kubero.inf.uct.cl` |

Si el token vence, se crea uno nuevo en Kubero y se reemplaza el secret.

### En la app móvil

En `mobile/.env` de cada integrante (igual que en `mobile/.env.example`):

```
EXPO_PUBLIC_API_DESTINO=mock
EXPO_PUBLIC_API_URL_MOCK=https://scgi-api.inf.uct.cl/api
```

Después de cambiar el `.env`, iniciar Expo con `npx expo start -c` para que
tome los valores nuevos.

## Si algo falla

En Kubero, abrir la app `mock-server` y revisar Resumen, Registros y Eventos.

| Síntoma | Causa probable |
|---|---|
| `ImagePullBackOff` | El paquete de GHCR quedó privado |
| `CrashLoopBackOff` | El mock se cae al iniciar: ver Registros |
| El navegador dice `DNS_PROBE_FINISHED_NXDOMAIN` | DNS del equipo con la respuesta antigua: `ipconfig /flushdns` u otro navegador |
| El job `kubero` falla con 401 | Token vencido o mal copiado |
| El job `kubero` queda en verde pero el pod no se reinicia | Nombre de pipeline, fase o app distinto en las variables (Kubero respondió bien aunque la app aún no existía) |
