# Esquema de subida de evidencias fotográficas — Cloudinary

**Tarea:** Configurar la cuenta/carpeta de Cloudinary y definir el esquema de subida de imágenes — RF4
**Responsable:** Débora Vizama
**Sprint:** 2

## Configuración de la cuenta

| Parámetro | Valor |
|---|---|
| Cloud Name | `l75ago2l` |
| Upload Preset | `scgi_preset` |
| Signing Mode | Unsigned |
| Asset Folder | `scgi_incidencias` |
| Prepend path al public_id | Activado — usa el path inicial del Asset Folder automáticamente |

## Por qué modo Unsigned

La subida de evidencias se hace directamente desde el cliente (app móvil), sin pasar por un backend propio para esto. El modo *Unsigned* permite subir archivos usando solo el `cloud_name` y el `upload_preset`, sin necesitar el API Key ni el API Secret de la cuenta.

**Importante:** el API Key y el API Secret de Cloudinary **no se usan ni se guardan en ningún `.env`** del proyecto móvil. No son necesarios para este flujo y nunca deben incluirse en variables `EXPO_PUBLIC_*`, porque esas variables quedan visibles en el bundle de la app (texto plano, accesible por cualquiera que inspeccione el build).

## Variables de entorno

En `.env.example` (sin valores, se sube al repo):

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

En `.env` local (con valores reales, nunca se sube — está en `.gitignore`):

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=l75ago2l
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=scgi_preset
```

## Estructura del public_id generado

Como el Asset Folder (`scgi_incidencias`) está configurado para anteponerse automáticamente al `public_id`, cada imagen subida genera un identificador con este formato:

```
scgi_incidencias/<id_autogenerado_por_cloudinary>
```

Ejemplo: `scgi_incidencias/k3j8f9x2mliqwz`

Este comportamiento se actualiza solo si en el futuro cambia el nombre del Asset Folder en la configuración del preset — no requiere tocar código.

## Cómo consumir la respuesta de subida

**Regla para cualquier servicio que suba imágenes (por ejemplo `cloudinaryService.js`):** usar siempre el campo `secure_url` que devuelve Cloudinary en la respuesta de la subida para guardar o mostrar la imagen. No construir la URL manualmente combinando folder + public_id — `secure_url` ya viene completo y correcto.

Ejemplo de respuesta relevante de Cloudinary tras una subida exitosa:

```json
{
  "public_id": "scgi_incidencias/k3j8f9x2mliqwz",
  "secure_url": "https://res.cloudinary.com/<cloud_name>/image/upload/v.../scgi_incidencias/k3j8f9x2mliqwz.jpg"
}
```

Ese `secure_url` es el valor que se debe asociar a la incidencia como evidencia fotográfica (campo `evidencias` del esquema OpenAPI de Incidencia).

## Checklist para integrar la subida de imágenes

Cualquier servicio del proyecto que necesite subir imágenes a Cloudinary debe usar:

- Cloud Name: ver `.env` local de cada integrante
- Upload Preset: `scgi_preset`
- Modo: Unsigned (sin firma, no requiere API Key/Secret)
- Endpoint de subida estándar de Cloudinary: `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`
- Guardar siempre `secure_url` de la respuesta, nunca construir la URL a mano