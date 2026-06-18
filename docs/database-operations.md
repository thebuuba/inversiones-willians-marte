# Database Operations

This project uses Prisma migrations against Supabase Postgres.

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

Supabase owns automated backups for the project database. Before any risky migration:

1. Confirm the latest Supabase backup is recent enough for rollback.
2. Export a manual SQL backup from the Supabase dashboard when the migration changes money, loan, payment, investor, or user tables.
3. Store the backup outside the repository.
4. Record who ran the migration, when it ran, and which commit was deployed.

## Restore Drill

Before relying on backups in production, test restore once against a separate Supabase project or local Postgres instance:

1. Restore the backup into the safe target.
2. Point a local `.env` at the restored database.
3. Run:

```bash
pnpm db:migrate:deploy
pnpm --filter backend test
```

4. Verify login, clients, loans, payments, and reports against the restored data.

## Credentials

Keep `DATABASE_URL` in environment variables only. Never commit database URLs, Supabase service-role keys, dashboard access tokens, exports, or SQL backup files.
