# Conmutación del servidor de la API

**Sprint 2 — T8:** Configurar el mecanismo de conmutación de baseURL entre el mock propio y el backend de TI2 — RF3
**Sprint 3:** Configurar las nuevas rutas en el mecanismo de conmutación de baseURL — RF5, RF6, RF8
**Responsable:** Cristóbal Pichara

## Cómo cambiar de servidor

En `mobile/.env`, cambiar `EXPO_PUBLIC_API_DESTINO` y reiniciar Expo con `npx expo start -c`.

| Valor | Servidor |
|---|---|
| `mock` (por defecto) | `EXPO_PUBLIC_API_URL_MOCK`, el mock propio en Render |
| `ti2` | `EXPO_PUBLIC_API_URL_TI2`, el backend de Taller de Integración 2 |

No se toca código: `mobile/src/api/config.js` resuelve la URL de cada ruta y
`client.js` la usa en todas las peticiones.

## Rutas por servicio (Sprint 3)

El contrato define un microservicio por grupo de rutas. `config.js` asigna cada
ruta a su servicio según su primer segmento, y una prueba comprueba que todas
las rutas de `docs/api/openapi.yaml` tengan servicio.

| Servicio | Rutas | Nuevas en v1.3.0 |
|---|---|---|
| autenticacion | `/autenticacion`, `/roles`, `/usuarios` | `GET /usuarios` |
| activos | `/activos`, `/edificios`, `/ubicaciones`, `/categorias`, `/estados-activo`, `/mantenimientos` | `GET /activos/{id_activo}/historial-fallas` |
| incidencias | `/incidencias`, `/ordenes-trabajo`, `/estados-incidencia`, `/tipos-evidencia` | `PATCH /incidencias/{id}/clasificacion`, `GET /estados-incidencia/transiciones` |
| notificaciones | `/notificaciones`, `/dispositivos` | todas (`GET /notificaciones`, `PATCH /notificaciones/{id}/leida`, `POST /dispositivos`, `DELETE /dispositivos/{id}`) |

### URL propia por microservicio de TI2

Si TI2 publica cada microservicio con su propia URL (por ejemplo, una app por
servicio en Kubero), se agregan en `mobile/.env` las que correspondan. Las que
falten usan `EXPO_PUBLIC_API_URL_TI2`:

    EXPO_PUBLIC_API_URL_TI2_AUTENTICACION=
    EXPO_PUBLIC_API_URL_TI2_ACTIVOS=
    EXPO_PUBLIC_API_URL_TI2_INCIDENCIAS=
    EXPO_PUBLIC_API_URL_TI2_NOTIFICACIONES=

Ejemplos con `EXPO_PUBLIC_API_DESTINO=ti2`:

| Configuración | Resultado |
|---|---|
| Solo `EXPO_PUBLIC_API_URL_TI2` | Todo va a TI2 (como en el Sprint 2) |
| `EXPO_PUBLIC_API_URL_TI2` y `..._TI2_NOTIFICACIONES` | Notificaciones a su servicio, el resto a la URL general de TI2 |
| Solo `..._TI2_INCIDENCIAS` | Incidencias a TI2; autenticación, activos y notificaciones quedan en el mock |

## Respaldo

Si se elige `ti2` y un servicio no tiene URL de TI2, ese servicio usa el mock y
la consola de desarrollo avisa cuáles quedaron en respaldo. Si ninguno tiene URL
de TI2, o el valor del flag es desconocido, toda la app usa el mock.

## Compatibilidad

- `EXPO_PUBLIC_API_URL` (Sprint 1) se sigue aceptando como URL del mock.
- Sin las variables nuevas, la app se comporta igual que en el Sprint 2.

## Formato de las URLs

Raíz de la API, sin versión ni barra final. La app agrega `/v1`.

```
https://scgi-info1173-1.onrender.com/api
```

## Pruebas

- `mobile/src/api/__tests__/config.test.js`: combinaciones del `.env`, servicio
  de cada ruta nueva y cobertura de todas las rutas del contrato.
- `mobile/src/api/__tests__/conmutacion-rutas.test.js`: de punta a punta, las
  rutas nuevas de `incidentService`, `assetService` y `notificationService`
  salen hacia el servidor que corresponde en cada escenario.

## Estado al cierre del Sprint 2 (T9)

- Destino configurado: `mock` (URL en el `mobile/.env` de cada integrante)
- Motivo: el backend de TI2 aún no está desplegado. TI2 informó que lo publicará
  en Kubero; la URL, un usuario de prueba y un activo registrado se entregarán
  después del despliegue.
- Decisión: según la planificación, se mantiene el mock de Render como entorno de
  demostración del sprint.
- Para conmutar cuando TI2 entregue su URL: en `mobile/.env`, poner
  `EXPO_PUBLIC_API_DESTINO=ti2` y `EXPO_PUBLIC_API_URL_TI2=<url con HTTPS hasta /api>`,
  reiniciar con `npx expo start -c` y repetir la medición de RNF1 con
  `mock-server/medir-rnf1-incidencias.js`.