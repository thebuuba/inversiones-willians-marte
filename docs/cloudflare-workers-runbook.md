# Runbook de staging para Cloudflare Workers

Este runbook publica primero un entorno paralelo. No cambia DNS ni elimina Render, archivos locales
o recursos anteriores.

## 1. Puerta local

```bash
pnpm --filter backend lint
pnpm --filter backend test --runInBand
pnpm --filter backend test:e2e --runInBand
pnpm --filter backend worker:build:staging
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend test
NEXT_PUBLIC_API_URL=https://API-STAGING.workers.dev/api/v1 \
  pnpm --filter @inversiones/frontend worker:build
pnpm ios:test
pnpm android:check
```

## 2. Recursos y configuracion

1. Crear `inversiones-willians-marte-documents-staging` como bucket R2 privado.
2. Crear Hyperdrive con la conexion directa de Supabase y un usuario PostgreSQL dedicado.
3. Agregar el ID de Hyperdrive a `apps/backend/wrangler.jsonc`.
4. Sustituir todos los dominios `example.com` en ambos `wrangler.jsonc`.
5. Cargar `JWT_SECRET` con `wrangler secret put`; nunca escribir su valor en JSON o Git.
6. Confirmar que CORS del backend contiene exclusivamente el dominio web de staging.

## 3. Datos y despliegue paralelo

```bash
pnpm --filter backend worker:r2:migrate:staging
pnpm --filter backend worker:r2:migrate:staging -- --execute
pnpm --filter backend worker:deploy:staging
NEXT_PUBLIC_API_URL=https://API-STAGING.workers.dev/api/v1 \
  pnpm --filter @inversiones/frontend worker:deploy:staging
```

Guardar el inventario SHA-256 del migrador como evidencia del cambio. No usar `--overwrite` ante un
conflicto hasta comparar el archivo local, el objeto R2 y el documento que lo referencia.

Para migraciones historicas, el comando acepta `--key-prefix`, `--filename-prefix`,
`--filename-suffix`, `--content-type` y uno o mas `--exclude`. Estos parametros permiten separar
objetos antiguos y omitir residuos no referenciados sin borrar los archivos fuente.

## 4. Validacion de staging

```bash
SMOKE_USERNAME=usuario SMOKE_PASSWORD='...' pnpm cloudflare:smoke -- \
  --api-url https://API-STAGING.workers.dev/api/v1 \
  --web-url https://WEB-STAGING.workers.dev
```

Completar manualmente:

- iniciar y cerrar sesion;
- crear un cliente de prueba;
- subir una imagen desde escritorio y desde el enlace QR;
- comprobar que se puede ver la variante procesada y descargar el original;
- renombrar y eliminar el documento, confirmando que ambos objetos salen de R2;
- crear un prestamo y un pago de prueba;
- revisar errores, CPU, latencia y subrequests en Workers Observability;
- verificar iOS y Android contra la URL de API de staging.

## 5. Ampliacion y reversion

Ampliar trafico solamente después de una ventana estable acordada. Cambiar primero el frontend y
mantener la API anterior disponible; cambiar la API después de validar sesiones y CORS.

Para revertir:

1. restaurar el dominio web anterior;
2. restaurar la URL de API anterior en clientes web/moviles;
3. retirar la ruta o dominio del Worker backend;
4. conservar R2 y PostgreSQL para investigacion; no borrar ni sobrescribir datos;
5. registrar hora, sintoma, version Worker y request IDs afectados.
