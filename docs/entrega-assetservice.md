# Entrega de assetService.js a Enzo

Archivo: `mobile/src/services/assetService.js`
Requisito: RF2. Contrato: OpenAPI v1.1.0.

## Funciones

| Funcion | Recibe | Devuelve |
|---|---|---|
| `obtenerActivoPorCodigoQr(codigoQr)` | El texto leido del QR, por ejemplo `UCT-INF-1024` | El activo completo |
| `buscarActivos(busqueda, limite = 20)` | Texto a buscar | Lista de activos, vacia si no hay coincidencias |
| `obtenerActivoPorId(idActivo)` | El id del activo (UUID) | El activo completo |
| `limpiarCache()` | — | Nada. Vacia la cache; llamarla al cerrar sesion |

Los activos consultados quedan en memoria, asi que volver a escanear el mismo
equipo no genera una nueva peticion al servidor.

## Errores

Todas lanzan un `ApiError` con `mensaje`, `status` y `tipo`:

- `status: 404` cuando el codigo no esta registrado, que es el caso que lleva
  a la busqueda manual.
- `tipo: 'sin_conexion'` o `tipo: 'timeout'` cuando falla la red.

## Puntos a resolver antes de fusionar los repositorios

1. `src/features/qr/assetService.js` queda sin uso: `scanController` debe
   importar `src/services/assetService.js`.
2. `buscarActivo` devolvia verdadero o falso. La funcion real devuelve el activo
   o lanza un error 404, asi que `if (existeEnBD)` cambia por un try/catch.
3. Los roles del sistema son `REPORTANTE`, `SUPERVISOR`, `TECNICO` y
   `ADMINISTRADOR`, en mayusculas y sin tilde. `scanController` compara contra
   `'Tecnico'` y `'Reportante'`, y con la sesion real esa comparacion falla.
4. `scanHistory.js` usa `@react-native-async-storage/async-storage`, que aun no
   esta instalado en el proyecto.