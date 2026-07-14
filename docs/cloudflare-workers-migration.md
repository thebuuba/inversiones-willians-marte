# Migracion a Cloudflare Workers

Esta migracion se desarrolla en `feat/cloudflare-workers-migration`. El servidor Node actual y su
despliegue no se modifican mientras el Worker se valida en staging.

## Estado actual

El primer hito ya dispone de:

- entrada ES Module compatible con Workers;
- NestJS sobre la integracion HTTP de Cloudflare;
- endpoints `health` y `auth` con el mismo prefijo `/api/v1`;
- JWT, validacion, CORS, Helmet, request IDs y formato de errores existentes;
- Prisma 6.19 sin binario Rust y con `@prisma/adapter-pg`;
- un cliente Prisma independiente por solicitud Worker;
- conexion local directa y soporte para el binding `HYPERDRIVE`;
- configuracion de Wrangler y dry-run para staging.

El Worker de esta etapa no debe recibir trafico de produccion. Los modulos de documentos siguen
dependiendo de `uploads/` y `sharp`; se incorporaran despues de migrar el almacenamiento a R2.

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
6. Cargar el mismo secreto JWT del backend actual para conservar la compatibilidad de sesiones:

```bash
cd apps/backend
pnpm exec wrangler secret put JWT_SECRET --env staging
```

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

## Puertas antes de ampliar el trafico

- build y dry-run sin errores;
- health consulta Supabase mediante Hyperdrive;
- login y perfil funcionan con JWT;
- bundle por debajo del limite de Workers Paid;
- ningun secreto aparece en Git o logs;
- backend Node, pruebas unitarias y e2e siguen funcionando;
- latencia y CPU registradas en observabilidad de Cloudflare.

## Reversion

Este hito no cambia DNS ni el frontend. Para revertir staging basta con retirar la ruta o dominio
del Worker. Render y la base de datos permanecen operativos y las migraciones existentes no se
alteran.

## Siguientes etapas

1. Crear R2 y la abstraccion de almacenamiento privado.
2. Migrar las capturas temporales y documentos fuera de `uploads/`.
3. Sustituir `sharp` por procesamiento compatible con Workers/navegador.
4. Incorporar los modulos restantes al Worker por grupos y ejecutar pruebas contractuales.
5. Migrar el frontend Next.js con OpenNext.
6. Ejecutar pruebas completas web, iOS y Android antes de cualquier cambio de DNS.
