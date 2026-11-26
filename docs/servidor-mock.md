# Servidor mock del contrato SCGI

Direccion: https://scgi-info1173-1.onrender.com
Contrato: OpenAPI v1.3.0 (`docs/api/openapi.yaml`). Codigo: carpeta `mock-server/`.

Es temporal. Cuando TI2 publique el backend real, la app cambia de servidor con
las variables del `.env` y el codigo no se toca.

## Configuracion de la app

En `mobile/.env`, con la URL terminada en /api porque client.js agrega el /v1:

    EXPO_PUBLIC_API_DESTINO=mock
    EXPO_PUBLIC_API_URL_MOCK=https://scgi-info1173-1.onrender.com/api
    EXPO_PUBLIC_API_URL_TI2=

## Usuarios de prueba

Todos con la contrasena `Secreta123`:

- ana.rojas@uct.cl (REPORTANTE)
- luis.munoz@uct.cl (SUPERVISOR)
- marta.silva@uct.cl (TECNICO)
- pedro.castro@uct.cl (ADMINISTRADOR)

## Activos de prueba

- UCT-INF-1024, Proyector sala 3
- UCT-INF-1025, Computador laboratorio 2
- UCT-ADM-2048, Impresora secretaria

## Datos semilla del ciclo de vida (Sprint 3: RF5, RF6, RF8)

Ciclo de vida de 8 estados: 1 Pendiente de revision, 2 Clasificada, 3 Asignada,
4 En diagnostico, 5 En reparacion, 6 Resuelta, 7 Verificada, 8 Cerrada (final).
La matriz de transiciones es la de `GET /estados-incidencia/transiciones`.

Incidencias de ejemplo, una por punto del ciclo de vida que la demo necesita:

| Incidencia | Activo | Estado | Para probar |
|---|---|---|---|
| Proyector no enciende | Proyector sala 3 | Pendiente de revision | Bandeja del supervisor: clasificar y asignar |
| Teclado con teclas pegadas | Computador laboratorio 2 | Asignada a Marta | El tecnico avanza el estado |
| Impresora atasca el papel | Impresora secretaria | Resuelta | El supervisor verifica o rechaza la solucion |
| Imagen con franjas de color | Proyector sala 3 | Cerrada | Historial de fallas y trazabilidad completa |

Cada incidencia trae su historial de estados (con comentarios) y, si esta
asignada, su orden de trabajo.

Notificaciones iniciales (RF8):

- Luis: nueva_incidencia del proyector y cambio_estado de la impresora (sin leer).
- Marta: incidencia_asignada del teclado (sin leer).
- Ana: cambio_estado del teclado (sin leer) y del proyector cerrado (leida).

Mientras corre, el mock genera notificaciones automaticas:

- Al registrar una incidencia: nueva_incidencia para los supervisores.
- Al crear una orden de trabajo: incidencia_asignada para el tecnico.
- En cada cambio de estado: cambio_estado para el reportante.

Si el usuario registro su telefono con `POST /dispositivos`, el mock tambien
envia la push por el servicio de Expo (de mejor esfuerzo: si falla, la
notificacion igual queda en `GET /notificaciones`).

## Comprobar el mock

`probar-ciclo-vida.js` recorre el ciclo completo de una incidencia nueva
(reporte, clasificacion, asignacion, los 8 estados, historial, historial de
fallas, notificaciones y dispositivos) y termina en "Todo OK". Crea su propia
incidencia, asi que se puede repetir.

    cd mock-server
    node probar-ciclo-vida.js                                        (mock local)
    node probar-ciclo-vida.js https://scgi-info1173-1.onrender.com   (Render)

## Limitaciones del plan gratuito

- El servicio se apaga tras un rato sin trafico y la primera peticion despues
  tarda bastante. Hay que considerarlo al medir los tiempos de RNF1.
- Los datos viven en memoria: cada reinicio vuelve a los datos semilla.