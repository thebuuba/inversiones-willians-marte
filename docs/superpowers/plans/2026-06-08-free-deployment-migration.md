# Free Deployment Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the monorepo for free deployment on Vercel, Render, and Supabase.

**Architecture:** Keep the existing split app architecture. Vercel hosts `apps/frontend`; Render builds and starts the backend from the repository root; Supabase provides Postgres through `DATABASE_URL`.

**Tech Stack:** Next.js 16, NestJS 11, Prisma 6, pnpm workspaces, Vercel, Render, Supabase Postgres.

---

### Task 1: Prisma Migration Scripts

**Files:**
- Modify: `package.json`
- Modify: `packages/database/package.json`

- [ ] Add a root `db:migrate:deploy` script that delegates to `@inversiones/database`.
- [ ] Add a database package `migrate:deploy` script that runs `prisma migrate deploy` against `packages/database/prisma/schema.prisma`.
- [ ] Verify with `pnpm --filter @inversiones/database run migrate:deploy --help` if needed, and use the script only when `DATABASE_URL` points to Supabase.

### Task 2: Backend Health Check

**Files:**
- Create: `apps/backend/src/health.controller.ts`
- Modify: `apps/backend/src/app.module.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [ ] Update the e2e test to request `/api/v1/health` and expect `{ "status": "ok", "service": "backend" }`.
- [ ] Run `pnpm --filter backend test:e2e` and confirm it fails because the route does not exist.
- [ ] Add `HealthController` with a `GET /health` handler.
- [ ] Register `HealthController` in `AppModule`.
- [ ] Run `pnpm --filter backend test:e2e` and confirm it passes.

### Task 3: Deployment Documentation

**Files:**
- Create: `docs/free-deployment.md`
- Create: `apps/frontend/.env.example`
- Modify: `apps/backend/.env.example`

- [ ] Document Supabase, Render, and Vercel setup with exact env var names.
- [ ] Document that Render must build from repository root with `pnpm --filter backend build`.
- [ ] Document that Vercel must set `NEXT_PUBLIC_API_URL` to `https://<render-service>/api/v1`.
- [ ] Add frontend env example for local and production API URLs.
- [ ] Keep backend env example aligned with Render/Supabase variable names.

### Task 4: Verification

**Files:**
- No source changes expected.

- [ ] Run `pnpm build`.
- [ ] Run `pnpm --filter @inversiones/frontend lint`.
- [ ] Run backend lint non-destructively with `pnpm --filter backend exec eslint "{src,apps,libs,test}/**/*.ts"`.
- [ ] Run `pnpm --filter backend test`.
- [ ] Run `pnpm --filter backend test:e2e`.
- [ ] Run frontend `node:test` files through the database package `tsx` binary.
- [ ] Confirm `git status --short` contains only intended changes.
