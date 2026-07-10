# Inversiones Willians Marte

Sistema monorepo para administrar clientes, préstamos, cobros, inversionistas, carteras, documentos, tareas, reportes y auditoría.

## Componentes

- `apps/backend`: API NestJS con JWT, Prisma y PostgreSQL.
- `apps/frontend`: aplicación web Next.js y PWA.
- `apps/ios`: cliente nativo SwiftUI.
- `apps/android`: contenedor Android.
- `packages/database`: esquema y migraciones Prisma.
- `packages/shared`: contratos compartidos de TypeScript.

## Requisitos

- Node.js 20 o posterior.
- pnpm 10.8.0.
- PostgreSQL compatible con el esquema Prisma.
- Swift instalado para compilar o probar la aplicación iOS.

## Configuración

```bash
pnpm install --frozen-lockfile
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local
pnpm db:generate
pnpm db:migrate:deploy
```

Define `DATABASE_URL` y un `JWT_SECRET` largo y aleatorio antes de iniciar el backend. No almacenes secretos reales en Git.

## Desarrollo

```bash
pnpm dev
```

El backend utiliza el puerto `3000` y el frontend el `3001` de forma predeterminada.

## Verificación

```bash
pnpm lint
pnpm test
pnpm build
pnpm --filter backend test:e2e --runInBand
pnpm ios:test
pnpm android:check
pnpm audit --prod
```

## Operación

Consulta `docs/database-operations.md`, `docs/operations-troubleshooting.md`, `docs/permissions.md` y `docs/pwa-deployment.md` para migraciones, diagnóstico, permisos y despliegue.
