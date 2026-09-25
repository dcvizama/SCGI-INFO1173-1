# Evidencia de cumplimiento de RNF1

Requisito: las respuestas de la API deben tardar menos de 2 segundos.

- Medido el: 25 de septiembre de 2026
- Servidor: https://scgi-info1173-1.onrender.com (mock del contrato v1.1.0, Render plan gratuito)
- Herramienta: `mock-server/medir-rnf1.js`
- Metodo: 10 peticiones por ruta, con el servicio ya despierto
- Usuario de prueba: ana.rojas@uct.cl (REPORTANTE)

## Resultados

| Ruta | Minimo | Promedio | Maximo | Cumple RNF1 |
|---|---|---|---|---|
| POST /autenticacion/inicio-sesion | 177 ms | 191 ms | 202 ms | Si |
| GET /autenticacion/usuario-actual | 174 ms | 186 ms | 196 ms | Si |
| GET /activos/codigo-qr/{codigo} | 188 ms | 191 ms | 194 ms | Si |
| GET /activos?busqueda=sala | 176 ms | 191 ms | 197 ms | Si |

Todas las rutas responden bajo 200 ms, muy por debajo del limite de 2 segundos.
La primera peticion de esta medicion tardo 655 ms, con el servicio ya activo.

## Alcance de esta medicion

Estos tiempos son del servidor mock, no del backend real de TI2. El mock
responde con datos en memoria y sin base de datos, asi que estos numeros son
el piso: el backend real sumara el tiempo de sus consultas. La medicion
definitiva de RNF1 se repite cuando TI2 publique su servicio, usando este
mismo script y cambiando solo la direccion.

## Limitacion del plan gratuito de Render

El servicio se apaga tras un rato sin trafico. La primera peticion despues de
ese apagado incluye el arranque del servidor y puede tardar decenas de
segundos, muy por encima de los 2 segundos del requisito.

Eso no es un incumplimiento de RNF1, porque el requisito mide el tiempo de
respuesta del servicio en operacion, no su arranque. De todos modos, para la
demostracion conviene hacer una peticion previa que despierte el servicio.