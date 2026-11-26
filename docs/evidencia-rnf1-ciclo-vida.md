# Evidencia de cumplimiento de RNF1 — Cambio de estado de incidencias (Sprint 3)

Requisito: las respuestas de la API deben tardar menos de 2 segundos.

**Tarea:** SCRUM-141. Medir los tiempos de respuesta del cambio de estado y documentar el cumplimiento de RNF1
**Responsable:** Cristóbal Pichara
**Herramienta:** `mock-server/medir-rnf1-ciclo-vida.js`
**Continuación de:** `docs/evidencia-rnf1.md` (Sprint 1: autenticación y activos) y
`docs/evidencia-rnf1-incidencias.md` (Sprint 2: creación de incidencias)

## Escenarios medidos

| Escenario | Quién | Qué mide | Peticiones |
|---|---|---|---|
| A | Supervisor | `PATCH /incidencias/{id}/clasificacion`: Pendiente de revisión a Clasificada | 1 |
| B | Supervisor | Asignar técnico como lo hace `asignarIncidencia`: `POST /ordenes-trabajo` y relectura con `GET /incidencias/{id}` | 2 seguidas |
| C | Técnico | `PATCH /incidencias/{id}/estado`: Asignada a En diagnóstico | 1 |
| D | Técnico | Cambio de estado como lo espera el usuario en la app: `PATCH .../estado` (En diagnóstico a En reparación) y recarga de la línea de tiempo con `GET .../historial` | 2 seguidas |

Cada repetición crea una incidencia nueva y la recorre de Pendiente de revisión a En
reparación, así cada escenario se mide sobre una transición válida de la matriz.

## Medición — Render

- Medido el: 26 de noviembre de 2026 (17:01 UTC)
- Servidor: `https://scgi-info1173-1.onrender.com` (mock del contrato v1.3.0 con los
  acuerdos de TI2, commit `3561914`)
- Método: 10 repeticiones por escenario
- Usuarios de prueba: luis.munoz@uct.cl (SUPERVISOR) y marta.silva@uct.cl (TECNICO);
  las incidencias las crea ana.rojas@uct.cl (REPORTANTE)

| Escenario | Mínimo | Promedio | Máximo | Cumple RNF1 |
|---|---|---|---|---|
| A. PATCH /incidencias/{id}/clasificacion | 176 ms | 194 ms | 206 ms | Sí |
| B. Asignar: POST /ordenes-trabajo + GET /incidencias/{id} | 361 ms | 395 ms | 495 ms | Sí |
| C. PATCH /incidencias/{id}/estado | 176 ms | 191 ms | 209 ms | Sí |
| D. Cambio de estado + GET .../historial (como la app) | 357 ms | 386 ms | 490 ms | Sí |

Primera petición (arranque): 324 ms. El servicio estaba activo porque se había
desplegado minutos antes.

**Resultado:** clasificar, asignar y cambiar el estado responden bajo 2 segundos. El
peor caso (495 ms) usa menos de un cuarto del límite.

## Análisis

- Una petición sola tarda unos 190 ms y dos seguidas unos 390 ms: el tiempo crece con
  la cantidad de peticiones, no con el tipo de cambio. Casi todo es la ida y vuelta
  por la red hasta Render; el procesamiento del mock es de pocos milisegundos.
- Por eso la app hace una sola acción y una sola relectura por cambio de estado
  (escenarios B y D). Si la relectura falla, el cambio igual queda hecho y la pantalla
  puede recargar la incidencia (`asignarIncidencia` e `IncidentContext`).
- Cada cambio de estado también genera la notificación para el reportante o el técnico
  (RF8). Se guarda en la misma petición, y el envío push por Expo no hace esperar la
  respuesta porque es de mejor esfuerzo.

## Alcance

Estos tiempos son del servidor mock, con datos en memoria y sin base de datos. El
backend de TI2 sumará sus consultas, el registro en el historial y la publicación del
evento en RabbitMQ. Cuando TI2 publique su gateway, la medición se repite con el mismo
script cambiando solo la dirección, siempre que sus rutas coincidan con el contrato.

## Limitación del plan gratuito de Render

Igual que en los sprints anteriores: tras un rato sin tráfico el servicio se apaga, y
la primera petición incluye el arranque, que puede tardar decenas de segundos. Eso no
incumple RNF1, que mide el servicio en operación. Antes de la demostración conviene
abrir la dirección del mock para despertarlo.

Además, Render no se actualiza solo con cada push a `cristobal`: después de cambiar el
mock hay que publicarlo con **Manual Deploy → Deploy latest commit**.

## Limpieza

Cada medición crea 10 incidencias, con sus órdenes de trabajo, su historial y sus
notificaciones. Se pierden cuando Render reinicia el servicio.