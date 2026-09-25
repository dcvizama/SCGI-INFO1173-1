# Evidencia de pruebas — RF1 Control de acceso por rol

**Sprint 1 · Patricio Valdés · Núcleo de sesión y navegación**
Fecha: 8 de septiembre de 2026
Build: Expo SDK 57 sobre Expo Go, Android físico

## Alcance

Verificar que el rol contenido en el payload del JWT determina las rutas
declaradas en el navegador privado, y que un rol no reconocido no obtiene acceso.

## Datos de prueba

Tokens mock con estructura JWT real (header.payload.firma), definidos en
`src/context/mockAuthService.js`. El payload incluye `sub`, `nombre`, `apellido`,
`correo`, `rol` y `exp`. Se reemplazan por el endpoint real de Taller de
Integración 2 en la tarea de semana 4.

## Resultados

| #   | Caso                    | Cuenta                              | Esperado                           | Obtenido | Resultado |
| --- | ----------------------- | ----------------------------------- | ---------------------------------- | -------- | --------- |
| 1   | Login rol Reportante    | reportante@uct.cl                   | Tabs Inicio, Escanear, Perfil      |          |           |
| 2   | Login rol Supervisor    | supervisor@uct.cl                   | Tabs Inicio, Escanear, Perfil      |          |           |
| 3   | Login rol Técnico       | tecnico@uct.cl                      | Tabs Inicio, Escanear, Perfil      |          |           |
| 4   | Login rol Administrador | admin@uct.cl                        | Tabs Inicio y Perfil, sin Escanear |          |           |
| 5   | Credenciales inválidas  | admin@uct.cl + clave errónea        | Error 401, permanece en login      |          |           |
| 6   | Rol no reconocido       | rol fuera de la matriz              | Pantalla de acceso denegado        |          |           |
| 7   | Persistencia de sesión  | cualquiera, cerrar y reabrir la app | Entra directo sin pasar por login  |          |           |
| 8   | Cierre de sesión        | cualquiera, botón Cerrar sesión     | Vuelve al login, token eliminado   |          |           |

## Capturas

| Archivo                                       | Caso |
| --------------------------------------------- | ---- |
| `docs/capturas/01-reportante.png`             | 1    |
| `docs/capturas/02-supervisor.png`             | 2    |
| `docs/capturas/03-tecnico.png`                | 3    |
| `docs/capturas/04-administrador.png`          | 4    |
| `docs/capturas/05-credenciales-invalidas.png` | 5    |
| `docs/capturas/06-acceso-denegado.png`        | 6    |

## Conclusión

_(completar tras ejecutar)_
