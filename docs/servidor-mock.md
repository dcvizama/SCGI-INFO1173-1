# Servidor mock del contrato SCGI

Direccion: https://scgi-info1173-1.onrender.com
Contrato: OpenAPI v1.1.0. Codigo: carpeta `mock-server/`.

Es temporal. Cuando TI2 publique el backend real, solo se cambia la variable
EXPO_PUBLIC_API_URL y el codigo de la app no se toca.

## Configuracion de la app

En `mobile/.env`, terminada en /api porque client.js agrega el /v1:

EXPO_PUBLIC_API_URL=https://scgi-info1173-1.onrender.com/api

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

## Limitacion del plan gratuito

El servicio se apaga tras un rato sin trafico y la primera peticion despues
tarda bastante. Hay que considerarlo al medir los tiempos de RNF1.