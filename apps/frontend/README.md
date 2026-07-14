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

## Cloudflare Workers

El frontend se empaqueta con OpenNext. El desarrollo diario sigue usando Next.js sobre Node; el
preview ejecuta el resultado final dentro de `workerd`, igual que Cloudflare Workers.

```bash
cp apps/frontend/.dev.vars.example apps/frontend/.dev.vars
pnpm --filter @inversiones/frontend worker:build
pnpm --filter @inversiones/frontend worker:preview
```

Antes del build de staging, define `NEXT_PUBLIC_API_URL` con la URL pública del Worker backend,
incluyendo `/api/v1`. Next.js incorpora las variables `NEXT_PUBLIC_*` en el JavaScript durante el
build, por lo que cambiarlas solamente en Wrangler después del build no actualiza el navegador.
Reemplaza también los dominios `*.example.com` de `wrangler.jsonc`: `INTERNAL_API_URL` es usado por
los proxies de captura y `MOBILE_BASE_URL` genera los enlaces QR.

```bash
NEXT_PUBLIC_API_URL=https://API-STAGING.workers.dev/api/v1 \
  pnpm --filter @inversiones/frontend worker:deploy:staging
```

El despliegue conserva el Worker Node anterior: estos scripts solo publican el frontend configurado
como `inversiones-willians-marte-web-staging`.
