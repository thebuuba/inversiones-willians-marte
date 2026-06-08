# Despliegue gratis: Vercel + Koyeb + Supabase

Esta guía reemplaza el trial vencido de Railway con servicios gratuitos para el stack actual:

- Frontend Next.js: Vercel
- Backend NestJS: Koyeb Free Instance
- Base de datos Postgres: Supabase Free

## 1. Supabase

1. Crea un proyecto en Supabase.
2. Copia el connection string de Postgres.
3. En tu máquina, configura `DATABASE_URL` apuntando a Supabase.
4. Aplica las migraciones:

```bash
pnpm db:migrate:deploy
```

5. Si necesitas datos iniciales:

```bash
pnpm db:seed
```

Usa el connection string del pooler si Supabase lo recomienda para apps serverless o con conexiones limitadas. El backend usa Prisma directamente; no usa Supabase Auth ni el SDK del navegador.

## 2. Backend en Koyeb

Crea un Web Service desde GitHub.

Configuración importante:

- Build method: Dockerfile
- Build context: repository root
- Dockerfile path: `apps/backend/Dockerfile`
- Instance: Free, si está disponible
- Port: usa la variable `$PORT`; el backend ya lee `process.env.PORT`
- Health check path: `/api/v1/health`

Variables de entorno:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=un-secreto-largo-y-aleatorio
FRONTEND_URL=https://tu-frontend.vercel.app
ADMIN_EMAIL=admin@inversiones.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=una-clave-fuerte
```

Después del deploy, verifica:

```text
https://tu-backend.koyeb.app/api/v1/health
```

Debe responder:

```json
{"status":"ok","service":"backend"}
```

## 3. Frontend en Vercel

Crea un proyecto en Vercel desde el mismo repositorio.

Configuración recomendada:

- Framework Preset: Next.js
- Root Directory: `apps/frontend`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @inversiones/frontend build`

Variable de entorno:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.koyeb.app/api/v1
```

Cuando Koyeb te entregue la URL real del backend, actualiza `NEXT_PUBLIC_API_URL` en Vercel y redeploya el frontend.

## 4. Orden correcto

1. Crear Supabase y obtener `DATABASE_URL`.
2. Ejecutar `pnpm db:migrate:deploy`.
3. Desplegar backend en Koyeb con `DATABASE_URL`, `JWT_SECRET` y `FRONTEND_URL`.
4. Verificar `/api/v1/health` en Koyeb.
5. Desplegar frontend en Vercel con `NEXT_PUBLIC_API_URL`.
6. Volver a Koyeb y confirmar que `FRONTEND_URL` coincide con el dominio final de Vercel.

## 5. Límites esperados

- Koyeb Free puede dormir por inactividad; la primera carga puede tardar.
- Supabase Free puede pausarse tras inactividad.
- Vercel Hobby tiene límites de uso mensuales.
- Para producción real con usuarios diarios, conviene pasar al menos el backend o la base de datos a un plan pago.

