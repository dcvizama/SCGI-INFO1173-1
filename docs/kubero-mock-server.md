# Servidor mock en Kubero

El `mock-server` se despliega como contenedor en Kubero (kubero.inf.uct.cl), la
plataforma que pide el ramo. Así la app usa una URL HTTPS estable para las
pruebas en el teléfono, en vez del servidor local o Render.

## Cómo funciona

El workflow `.github/workflows/mock-server-kubero.yml` se ejecuta con cada push
a `main` que cambie `mock-server/`, o a mano desde Actions:

1. Construye la imagen con `mock-server/Dockerfile`.
2. La publica en `ghcr.io/dcvizama/scgi-mock-server:latest`.
3. Le pide a Kubero que reinicie la app, para que descargue la imagen nueva.

Si la app de Kubero todavía no está configurada en GitHub, el paso 3 se salta.

## Configuración (una sola vez)

### En Kubero

En la app del mock-server:

| Campo | Valor |
|---|---|
| Imagen | `ghcr.io/dcvizama/scgi-mock-server:latest` |
| Puerto | `3000` |
| Política de descarga | `Always` (si no, el reinicio no toma la imagen nueva) |
| Variable `JWT_SECRET` | Una clave cualquiera, que no sea la de ejemplo |

Hay que anotar el nombre del pipeline, la fase y la app, y el dominio que
Kubero le asigna.

### En GitHub (dueña del repositorio)

En Settings → Secrets and variables → Actions:

- Secret `KUBERO_TOKEN`: token de la API de Kubero.
- Variables `KUBERO_PIPELINE`, `KUBERO_PHASE` y `KUBERO_APP`: los nombres de Kubero.
- Variable opcional `KUBERO_URL`, si Kubero no está en `https://kubero.inf.uct.cl`.

El paquete `scgi-mock-server` en GHCR (pestaña Packages) debe quedar público, o
Kubero necesitará credenciales para descargar la imagen.

### En la app móvil

En `mobile/.env` de cada integrante:

```
EXPO_PUBLIC_API_DESTINO=mock
EXPO_PUBLIC_API_URL_MOCK=https://<dominio-de-kubero>/api
```
