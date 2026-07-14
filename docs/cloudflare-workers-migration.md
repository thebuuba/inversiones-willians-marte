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
- configuracion de Wrangler y dry-run para staging.

El Worker de esta etapa no debe recibir trafico de produccion hasta crear Hyperdrive, el bucket R2
y copiar los documentos existentes. En Workers, las imagenes nuevas se guardan con estado
`needs_review`; el recorte con `sharp` sigue funcionando en Node hasta mover ese procesamiento al
navegador.

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
- las 83 rutas se registran durante el arranque;
- subida, descarga y eliminacion funcionan contra R2;
- bundle por debajo del limite de Workers Paid;
- ningun secreto aparece en Git o logs;
- backend Node, pruebas unitarias y e2e siguen funcionando;
- latencia y CPU registradas en observabilidad de Cloudflare.

## Reversion

Este hito no cambia DNS ni el frontend. Para revertir staging basta con retirar la ruta o dominio
del Worker. Render y la base de datos permanecen operativos y las migraciones existentes no se
alteran.

## Siguientes etapas

1. Crear Hyperdrive y R2 en la cuenta Cloudflare de staging.
2. Copiar a R2 los documentos existentes y verificar checksums.
3. Mover el recorte de imagenes al navegador para sustituir `sharp` en Workers.
4. Ejecutar pruebas contractuales de las 83 rutas contra staging.
5. Crear el Worker frontend de staging con el build OpenNext ya incorporado al repositorio.
6. Ejecutar pruebas completas web, iOS y Android antes de cualquier cambio de DNS.
