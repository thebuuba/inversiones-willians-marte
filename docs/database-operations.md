# Database Operations

This project uses Prisma migrations against Supabase Postgres.

## Runtime And Migration Credentials

The Worker uses the PostgreSQL role `app_backend` through Hyperdrive. This role is not an
administrator: it has CRUD grants only for application tables and explicit RLS policies. Prisma
migrations must continue to use the separate administrator connection, never `app_backend`.

Custom-role passwords are not included in Supabase physical backups. After a restore, reset the
`app_backend` password, verify its RLS policies, and update Hyperdrive before reopening the service.

Every migration that creates a new application table must also grant CRUD access to `app_backend`
and add an explicit `app_backend_full_access` RLS policy. Default privileges grant SQL permissions,
but they do not create RLS policies for future tables.

## Golden Rule

Use migrations for production:

```bash
pnpm db:migrate:deploy
```

Use schema push only for local development or a disposable database:

```bash
pnpm db:push:dev
```

`pnpm db:push` is kept as a compatibility alias, but it must not be used against production.

## Local Development

1. Point `DATABASE_URL` at a local or disposable database.
2. Edit `packages/database/prisma/schema.prisma`.
3. Create and apply a migration:

```bash
pnpm db:migrate
```

4. Regenerate Prisma Client if needed:

```bash
pnpm db:generate
```

`pnpm db:push:dev` is acceptable only when you are prototyping against a database that can be reset.

## Production Or Staging Deploy

1. Confirm `DATABASE_URL` points at the intended Supabase database.
2. Review pending migrations under `packages/database/prisma/migrations`.
3. Apply migrations:

```bash
pnpm db:migrate:deploy
```

4. Deploy the backend after migrations pass.
5. Check the backend health endpoint:

```bash
curl https://<backend-host>/api/v1/health
```

## Backup Policy

Supabase owns automated backups for the project database. R2 objects are separate and are not
included in a database backup. Before any risky migration:

1. Confirm the latest Supabase backup is recent enough for rollback.
2. Export a manual SQL backup from the Supabase dashboard when the migration changes money, loan, payment, investor, or user tables.
3. Export referenced R2 objects and an object manifest when the migration affects documents.
4. Store database and object backups outside the repository with private filesystem permissions.
5. Record who ran the migration, when it ran, and which commit was deployed.

## Restore Drill

Before relying on backups in production, test restore once against a separate Supabase project or local Postgres instance:

1. Create the non-login role `app_backend` in the safe target before restoring; the dumped RLS
   policies reference it.
2. Restore the backup into the safe target.
3. Point a local `.env` at the restored database.
4. Run:

```bash
pnpm db:migrate:deploy
pnpm --filter backend test
```

5. Verify login, clients, loans, payments, reports, the 23 `app_backend` policies, and any referenced
   R2 objects against the restored data.

## Credentials

Keep `DATABASE_URL` in environment variables only. Never commit database URLs, Supabase service-role keys, dashboard access tokens, exports, or SQL backup files.
