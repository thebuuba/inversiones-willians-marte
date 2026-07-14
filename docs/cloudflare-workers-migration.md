# Migracion a Cloudflare Workers

Esta migracion se desarrolla en `feat/cloudflare-workers-migration`. El servidor Node actual y su
despliegue no se modifican mientras el Worker se valida en staging.

## Estado actual

El primer hito ya dispone de:

- entrada ES Module compatible con Workers;
- NestJS sobre la integracion HTTP de Cloudflare;
- los 20 controladores y las 83 rutas con el mismo prefijo `/api/v1`;
- JWT, validacion, CORS, Helmet, request IDs y formato de errores existentes;
- Prisma 6.19 sin binario Rust y con `@prisma/adapter-pg`;
- un cliente Prisma independiente por solicitud Worker;
- conexion local directa y soporte para el binding `HYPERDRIVE`;
- almacenamiento dual: disco local para Node y binding privado `DOCUMENTS_BUCKET` para R2;
- cargas multipart en memoria, sin archivos temporales persistentes;
- `sharp` aislado del Worker y conservado en el arranque Node;
- recorte y optimizacion de documentos en el navegador, conservando original y procesado en R2;
- frontend Next.js 16 empaquetado con OpenNext y probado dentro de `workerd`;
- configuracion de Wrangler y dry-run para staging.

El Worker de esta etapa no debe recibir trafico de produccion hasta crear Hyperdrive, el bucket R2,
copiar los documentos existentes y completar la validacion de staging. Los navegadores actuales
envian la imagen original y una version WebP procesada; clientes antiguos quedan en
`needs_review`, y el servidor Node conserva Sharp como respaldo.

## Desarrollo local

Wrangler lee `apps/backend/.env` localmente. No se debe crear ni versionar `.dev.vars` con secretos
reales.

```bash
pnpm --filter backend worker:build:staging
pnpm --filter backend worker:dev
```

Comprobaciones:

```bash
curl http://localhost:8787/api/v1/health
curl -i http://localhost:8787/api/v1/auth/profile
```

La primera debe confirmar `database: "ok"`; la segunda debe responder `401` sin un JWT.

## Crear staging en Cloudflare

1. Crear una configuracion Hyperdrive desde el dashboard de Cloudflare.
2. Usar la cadena **Direct connection** de Supabase, no el pooler de Supavisor. Hyperdrive realiza
   su propio pooling.
3. Usar un usuario PostgreSQL dedicado con los privilegios minimos requeridos por la API.
4. Copiar el ID de Hyperdrive y agregar este bloque de nivel superior en `wrangler.jsonc`:

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "ID_DE_HYPERDRIVE"
  }
]
```

5. Reemplazar `https://staging.example.com` por el dominio real del frontend de staging.
6. Crear el bucket privado configurado en `wrangler.jsonc`:

```bash
cd apps/backend
pnpm exec wrangler r2 bucket create inversiones-willians-marte-documents-staging
```

7. Cargar el mismo secreto JWT del backend actual para conservar la compatibilidad de sesiones:

```bash
cd apps/backend
pnpm exec wrangler secret put JWT_SECRET --env staging
```

8. Inventariar los archivos locales sin modificar R2:

```bash
pnpm --filter backend worker:r2:migrate:staging
```

9. Después de revisar el bucket y el inventario SHA-256, ejecutar la copia idempotente:

```bash
pnpm --filter backend worker:r2:migrate:staging -- --execute
```

El comando descarga cada objeto después de cargarlo y compara SHA-256. Si ya existe un objeto
idéntico lo omite; si existe con contenido distinto, se detiene sin sobrescribirlo. `--overwrite`
debe usarse solamente después de investigar el conflicto.

No se debe configurar `DATABASE_URL` como secreto cuando `HYPERDRIVE` ya esta disponible. La URL
directa queda reservada para Prisma CLI, migraciones y desarrollo local.

## Compilar y desplegar

El dry-run no accede a Cloudflare ni cambia recursos:

```bash
pnpm --filter backend worker:build:staging
```

Cuando Hyperdrive, CORS y `JWT_SECRET` esten configurados:

```bash
pnpm --filter backend worker:deploy:staging
```

Validar en la URL entregada por Wrangler:

```bash
curl https://URL_DEL_WORKER/api/v1/health
curl -i https://URL_DEL_WORKER/api/v1/auth/profile
```

Luego se debe probar un login real de staging y `GET /api/v1/auth/profile` con el token obtenido.
El smoke test conjunto acepta las dos URLs y, opcionalmente, credenciales de staging:

```bash
SMOKE_USERNAME=usuario SMOKE_PASSWORD='...' pnpm cloudflare:smoke -- \
  --api-url https://API.workers.dev/api/v1 \
  --web-url https://WEB.workers.dev
```

## Puertas antes de ampliar el trafico

- build y dry-run sin errores;
- health consulta Supabase mediante Hyperdrive;
- login y perfil funcionan con JWT;
- las 83 rutas se registran durante el arranque;
- subida, descarga y eliminacion funcionan contra R2;
- bundle por debajo del limite de Workers Paid;
- ningun secreto aparece en Git o logs;
- backend Node, pruebas unitarias y e2e siguen funcionando;
- latencia y CPU registradas en observabilidad de Cloudflare.

## Reversion

Mientras no se cambie DNS, Render y el frontend anterior siguen siendo la reversion inmediata. Si
ya se amplio trafico, se revierte primero el dominio del frontend y despues el de API. R2 no se
elimina: contiene copias compatibles con los nombres ya registrados en PostgreSQL. Las migraciones
de base de datos existentes no se alteran.

## Siguientes etapas

1. Crear Hyperdrive y R2 en la cuenta Cloudflare de staging.
2. Sustituir los dominios `example.com` por las URLs reales de staging.
3. Copiar a R2 los documentos existentes y verificar checksums.
4. Ejecutar smoke, flujo autenticado y pruebas manuales de documentos contra staging.
5. Ejecutar pruebas completas web, iOS y Android antes de cualquier cambio de DNS.
