# PWA para iPhone

La aplicación puede instalarse en iPhone como PWA sin publicarla en App Store. Para que Safari permita agregarla a la pantalla de inicio con comportamiento de app, el frontend y el backend deben estar publicados por HTTPS.

## Requisitos de despliegue

- Publicar `apps/frontend` en un dominio con HTTPS.
- Publicar `apps/backend` en HTTPS y configurar la URL del API usada por el frontend.
- Mantener `/manifest.webmanifest`, `/sw.js` y `/icons/*` accesibles desde el mismo dominio del frontend.
- No cachear respuestas autenticadas del API en el service worker. El service worker actual solo precarga shell estático y evita rutas `/api/`.

## Instalación en iPhone

1. Abrir el dominio del sistema en Safari.
2. Iniciar sesión si aplica.
3. Tocar el botón de compartir.
4. Elegir `Agregar a pantalla de inicio`.
5. Abrir la app desde el icono creado.

## Verificación rápida

- `https://tu-dominio.com/manifest.webmanifest` debe responder el manifiesto.
- `https://tu-dominio.com/sw.js` debe responder el service worker.
- En Safari, la app debe abrir en modo independiente desde el icono de inicio.
- Sin conexión, una navegación nueva debe caer en `/offline`.

## Límites esperados

- iOS exige HTTPS para service workers, excepto en `localhost`.
- Las notificaciones push web en iPhone dependen de soporte del navegador y permisos del usuario.
- El modo offline no reemplaza al backend: préstamos, pagos e inversionistas siguen necesitando conexión para guardar cambios.
