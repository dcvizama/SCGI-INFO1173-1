# Entrega de incidentService — Sprint 2

**Responsable:** Cristóbal Pichara
**Destinatario:** Patricio Valdés (T6: conectar IncidentContext al incidentService real)
**Requisitos:** RF3, RF4, RNF3
**Rama:** `cristobal`
**Contrato:** `docs/api/openapi.yaml` v1.2.0

## Archivos

| Archivo | Contenido |
|---|---|
| `mobile/src/services/incidentService.js` | Creación de incidencias y adjunto de evidencias |
| `mobile/src/services/cloudinaryService.js` | Subida de fotos a Cloudinary (unsigned) |
| `mobile/src/services/fixtures/incidencias.js` | Datos de prueba con la forma del contrato |
| `mobile/src/services/__tests__/incidentService.test.js` | Pruebas del servicio |

## Cómo conectarlo (T6 de Patricio)

En `mobile/src/context/IncidentContext.js`, cambiar el import del mock:

```js
// Antes
import { crearIncidencia } from './mockIncidentService';

// Después
import { crearIncidencia } from '../services/incidentService';
```

Luego se puede borrar `mobile/src/context/mockIncidentService.js`.

## Función principal

```js
crearIncidencia(nuevaIncidencia, fotos = [])
```

Misma firma que el mock.

- `nuevaIncidencia`: `{ id_activo, titulo, descripcion, prioridad }`. `prioridad` es `'baja' | 'media' | 'alta'`; si no se envía, el backend usa `'media'`.
- `fotos`: URIs locales o los objetos `{ uri }` de expo-camera / expo-image-picker. Máximo 5.

Flujo interno:

1. `POST /incidencias` → crea la incidencia en estado Pendiente.
2. Por cada foto: subida a Cloudinary → `POST /incidencias/{id_incidencia}/evidencias` con la `secure_url`.
3. Devuelve la `Incidencia` con su arreglo `evidencias`.

## Qué devuelve

```js
{
  // Campos del esquema Incidencia del contrato
  id_incidencia, id_activo, id_reportante, titulo, descripcion,
  prioridad,              // 'baja' | 'media' | 'alta'
  estado,                 // { id_estado, nombre_estado: 'Pendiente' }
  fecha_creacion,
  evidencias,             // Evidencia[] completas del contrato

  // Campos propios de la app (no vienen del backend)
  evidenciasPendientes,   // fotos que no se alcanzaron a subir ([] si todo salió bien)
  errorEvidencias,        // ApiError de la foto que falló, o null
}
```

## Manejo de errores

| Situación | Comportamiento | Qué mostrar |
|---|---|---|
| Más de 5 fotos | Lanza `ApiError` con `tipo: 'archivo'`. No crea nada | `error.mensaje` |
| Falta `id_activo` | Lanza `ApiError` con `tipo: 'datos'`. No llama a la API | `error.mensaje` |
| Falla la creación (400, 404, 500, sin red, timeout) | Lanza `ApiError`. No se creó la incidencia | Estado de error; se puede reintentar todo |
| Se creó la incidencia, pero falla una foto | **No lanza.** Devuelve la incidencia con `evidenciasPendientes` y `errorEvidencias` | Éxito con aviso: "Incidencia creada, pero N fotos no se subieron" |

El último caso **no debe tratarse como error**: si el usuario reintenta todo, se crea una incidencia duplicada.

## Reintentar las fotos que faltaron

```js
import { reintentarEvidencias } from '../services/incidentService';

const actualizada = await reintentarEvidencias(incidencia, incidencia.evidenciasPendientes);
```

Sube solo las pendientes sobre la misma incidencia y devuelve la incidencia actualizada, con la misma forma.

## Diferencias con mockIncidentService

- `evidencias` trae objetos `Evidencia` completos (`id_evidencia`, `tipo`, `url_evidencia`, …), no solo la URI local.
- Ya no existe el título `"simular error"`. Para probar el error: modo avión, o un `id_activo` inexistente (404).
- `prioridad` ya está en el contrato v1.2.0. Se puede quitar el comentario de `incidentReducer.js` que decía que faltaba.

## Requisitos para que funcione

Variables en `mobile/.env`:

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=l75ago2l
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=scgi_preset
```

Pendientes:

- Rutas `POST /incidencias` y `POST /incidencias/{id_incidencia}/evidencias` en el mock de Render — tarea de datos semilla del mock (Cristóbal).
- `ID_TIPO_FOTOGRAFIA = 1` en `incidentService.js` — confirmar con TI2 el id del tipo Fotografía en `TIPOS_EVIDENCIA`.

## Pruebas

```powershell
cd mobile
npx jest src/services
```