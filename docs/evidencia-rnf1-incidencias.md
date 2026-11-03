# Evidencia de cumplimiento de RNF1 — Creación de incidencias (Sprint 2)

Requisito: las respuestas de la API deben tardar menos de 2 segundos.

**Tarea:** Medir los tiempos de respuesta de creación de incidencia (con y sin evidencia adjunta) y documentar el cumplimiento de RNF1
**Responsable:** Cristóbal Pichara
**Herramienta:** `mock-server/medir-rnf1-incidencias.js`
**Continuación de:** `docs/evidencia-rnf1.md` (Sprint 1: autenticación y activos)

## Escenarios medidos

| Escenario | Qué mide | Peticiones |
|---|---|---|
| A | `POST /incidencias` sin evidencia | 1 |
| B | `POST /incidencias/{id}/evidencias` con una URL ya subida | 1 |
| C | Creación con 1 evidencia, como lo hace la app | 2 seguidas |
| D | Flujo completo con foto real: subida a Cloudinary + incidencia + evidencia | 3 seguidas |

RNF1 se evalúa sobre las respuestas de la API (A, B y C). El escenario D incluye la
subida a Cloudinary, un servicio externo cuyo tiempo depende del tamaño de la foto
y de la red del dispositivo. Se informa como referencial porque es la espera real
del usuario al enviar un reporte con foto.

## Medición 1 — Local (preliminar)

- Medido el: 31 de octubre de 2026
- Servidor: `http://localhost:3000` (mock del contrato v1.2.0)
- Método: 10 repeticiones por escenario (5 en el escenario D)
- Usuario de prueba: ana.rojas@uct.cl (REPORTANTE)
- Foto de prueba: `mobile/assets/icon.png` (384 KB)

| Escenario | Mínimo | Promedio | Máximo | Cumple RNF1 |
|---|---|---|---|---|
| A. POST /incidencias (sin evidencia) | 2 ms | 2 ms | 4 ms | Sí |
| B. POST /incidencias/{id}/evidencias | 1 ms | 1 ms | 2 ms | Sí |
| C. Creación con 1 evidencia (incidencia + evidencia) | 2 ms | 2 ms | 2 ms | Sí |
| D. Flujo completo con foto de 384 KB (Cloudinary + API) | 561 ms | 785 ms | 1460 ms | Referencial (bajo 2 s) |

Primera petición (arranque): 158 ms.

Esta medición valida el script y el comportamiento de las rutas nuevas, pero no
incluye la latencia de red hacia Render. La evidencia definitiva es la medición 2.

## Medición 2 — Render (definitiva)

_Pendiente: se ejecuta cuando las rutas de incidencias estén desplegadas en Render._

```powershell
cd mock-server
$env:CLOUDINARY_CLOUD_NAME = "l75ago2l"
$env:CLOUDINARY_UPLOAD_PRESET = "scgi_preset"
node medir-rnf1-incidencias.js https://scgi-info1173-1.onrender.com
```

| Escenario | Mínimo | Promedio | Máximo | Cumple RNF1 |
|---|---|---|---|---|
| A. POST /incidencias (sin evidencia) | | | | |
| B. POST /incidencias/{id}/evidencias | | | | |
| C. Creación con 1 evidencia (incidencia + evidencia) | | | | |
| D. Flujo completo con foto (Cloudinary + API) | | | | Referencial |

## Análisis

- Crear una incidencia con evidencia requiere dos peticiones a la API. Aun sumadas,
  su tiempo es mínimo frente al límite de 2 segundos.
- En el flujo completo, casi todo el tiempo corresponde a la subida a Cloudinary
  (alrededor de 780 ms de 785 ms en local). Por eso la compresión y el redimensionado
  de las fotos antes de subirlas (tarea de Enzo, RF4 y RNF1) es lo que más influye
  en la espera real del usuario.
- Con 5 fotos, la subida a Cloudinary se repite 5 veces. El tiempo total del envío
  crece con la cantidad y el tamaño de las fotos, aunque cada respuesta de la API
  se mantenga bajo 2 segundos.

## Alcance

Estos tiempos son del servidor mock, con datos en memoria y sin base de datos. El
backend real de TI2 sumará el tiempo de sus consultas. La medición se repite con el
mismo script cuando TI2 publique su servicio, cambiando solo la dirección.

## Limitación del plan gratuito de Render

Igual que en el Sprint 1: tras un rato sin tráfico, el servicio se apaga y la primera
petición incluye el arranque, que puede tardar decenas de segundos. Eso no incumple
RNF1, que mide el servicio en operación. Antes de la demostración conviene hacer una
petición previa para despertarlo.

## Limpieza

Cada medición crea incidencias en el mock (35 por ejecución), que se pierden cuando
Render reinicia el servicio. El escenario D deja 5 imágenes en la carpeta
`scgi_incidencias` de Cloudinary, que se pueden borrar desde la Media Library.