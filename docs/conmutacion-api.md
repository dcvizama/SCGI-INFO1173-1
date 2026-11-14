# Conmutación del servidor de la API — Sprint 2

**Tarea:** Configurar el mecanismo de conmutación de baseURL entre el mock propio y el backend de TI2 — RF3
**Responsable:** Cristóbal Pichara

## Cómo cambiar de servidor

En `mobile/.env`, cambiar `EXPO_PUBLIC_API_DESTINO` y reiniciar Expo con `npx expo start -c`.

| Valor | Servidor |
|---|---|
| `mock` (por defecto) | `EXPO_PUBLIC_API_URL_MOCK`, el mock propio en Render |
| `ti2` | `EXPO_PUBLIC_API_URL_TI2`, el backend de Taller de Integración 2 |

No se toca código: `mobile/src/api/config.js` resuelve la URL y `client.js` la usa en todas las peticiones.

## Respaldo

Si se elige `ti2` y `EXPO_PUBLIC_API_URL_TI2` está vacía, o el valor es desconocido, la app usa el mock y muestra un aviso en la consola de desarrollo.

## Compatibilidad

`EXPO_PUBLIC_API_URL` (Sprint 1) se sigue aceptando como URL del mock.

## Formato de las URLs

Raíz de la API, sin versión ni barra final. La app agrega `/v1`.

```
https://scgi-info1173-1.onrender.com/api
```


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