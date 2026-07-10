# Aplicación web

Frontend Next.js 16 para la operación de Inversiones Willians Marte. Incluye panel, clientes, préstamos, cobros, inversionistas, documentos, solicitudes, tareas y funcionamiento PWA básico.

## Configuración

```bash
cp .env.example .env.local
pnpm --filter @inversiones/frontend dev
```

La aplicación se inicia en `http://localhost:3001`. `NEXT_PUBLIC_API_URL` debe apuntar a la ruta `/api/v1` del backend. Para capturas desde teléfonos, configura `NEXT_PUBLIC_MOBILE_BASE_URL` con una URL accesible desde la red local o pública.

## Verificación

```bash
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend test
pnpm --filter @inversiones/frontend build
```

El service worker excluye las solicitudes API de la caché de la aplicación. Revisa `docs/pwa-deployment.md` antes de publicar cambios relacionados con instalación u operación sin conexión.
