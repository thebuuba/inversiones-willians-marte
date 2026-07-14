# Inversiones Willians Marte API

Backend NestJS para gestionar clientes, inversionistas, prestamos, pagos, carteras, documentos, tareas, reportes y auditoria del sistema Inversiones Willians Marte.

## Stack

- NestJS 11
- Prisma via `@inversiones/database`
- PostgreSQL/Supabase
- JWT + bcrypt para autenticacion
- pnpm workspaces + Turborepo

## Desarrollo

Desde la raiz del monorepo:

```bash
pnpm install
pnpm db:generate
pnpm --filter backend start:dev
```

El backend requiere las variables de entorno definidas en `apps/backend/.env.example` y la conexion de base de datos configurada para Prisma.

## Scripts

```bash
pnpm --filter backend build
pnpm --filter backend lint
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend test:cov
```

### Cloudflare Workers (staging)

El backend incluye un punto de entrada Worker separado para validar NestJS, JWT y Prisma sin
reemplazar el servidor Node existente:

```bash
pnpm --filter backend worker:build:staging
pnpm --filter backend worker:dev
```

La configuracion de staging, Hyperdrive y secretos se documenta en
`docs/cloudflare-workers-migration.md`. El Worker actual es una primera etapa deliberadamente
limitada a `health` y `auth`; el resto de los modulos continua en el backend Node hasta completar
R2 y retirar las dependencias de almacenamiento local.

## Modulos principales

- `auth`: login, hashing de credenciales y emision de JWT.
- `clients`: administracion de clientes.
- `investors` e `investments`: inversionistas y movimientos de capital.
- `loans` y `loan-products`: productos, prestamos y amortizacion.
- `payments` e `investor-payments`: pagos de clientes e inversionistas.
- `documents`, `tasks`, `reports`, `audit`: operacion y trazabilidad.

## Notas operativas

- Los montos se persisten como `Decimal` en Prisma.
- La generacion de amortizacion vive en `src/modules/loans/amortization.service.ts`.
- Los filtros, interceptores, guards y middleware globales se registran desde `src/main.ts` y los modulos compartidos.
