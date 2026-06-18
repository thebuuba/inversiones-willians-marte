# Platform Hardening Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each phase task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the loan platform safer, more reliable, and easier to operate in production before adding more screens.

**Architecture:** Execute this as separate small PRs. Each phase has one production concern, clear verification, and no unrelated refactors.

**Tech Stack:** Next.js 16, NestJS 11, Prisma 6, Supabase Postgres, pnpm workspaces, Node test runner.

---

## Phase 1: Database Migrations And Backups

**Status:** Implemented on 2026-06-18. The repository already had 20 Prisma migrations, so no initial migration was created.

**Why first:** Data loss is the highest-risk failure.

**Files:**
- Modify: `package.json`
- Modify: `packages/database/package.json`
- Create: `docs/database-operations.md`

- [x] Stop using `db:push` for production changes; document it as local/dev only.
- [x] Standardize production deploys on `pnpm db:migrate:deploy`.
- [x] Create the first real Prisma migration from the current schema if migration history is incomplete.
- [x] Document Supabase backup schedule, restore steps, and who owns the database credentials.
- [x] Verification: run migration command against a safe target, then run `pnpm --filter backend test`.

## Phase 2: Permissions Review

**Status:** Implemented on 2026-06-18 for investor writes, investor capital changes, task deletes, and the permission matrix.

**Why second:** Money, users, loans, and investor operations need predictable access control.

**Files:**
- Modify: backend controllers under `apps/backend/src/modules/**`
- Modify or create focused backend tests near each changed module
- Create: `docs/permissions.md`

- [x] List every route and required role: `ADMIN`, `COLLECTOR`, or public.
- [x] Lock sensitive operations to `ADMIN`: user management, deleting records, investor capital changes, product configuration.
- [x] Keep collector workflows available where needed: client lookup, assigned collection work, payment creation if intended.
- [x] Add tests for at least one allowed and one denied request per sensitive module.
- [x] Verification: run `pnpm --filter backend test`.

## Phase 3: Audit Coverage

**Status:** Implemented on 2026-06-18 for loan creation, payment creation, loan status changes, user creation, user active toggles, investment creation, investment capital additions, investor payments, and deletes.

**Why third:** After permissions, every sensitive action should leave a trail.

**Files:**
- Modify: services that create/update/delete loans, payments, users, investors, investments, portfolios
- Modify: `apps/backend/src/modules/audit/*`
- Add focused service tests

- [x] Add audit events for loan creation, payment creation, investor payment, investment creation, and capital addition.
- [x] Add audit events for loan status changes, user changes, and deletes.
- [x] Store enough detail to answer: who did it, what changed, when, and which record was affected.
- [x] Avoid logging passwords, JWTs, document blobs, or secrets.
- [x] Verification: run backend audit/service tests and inspect one real audit log response.

## Phase 4: Offline And Slow-Network UX

**Status:** Implemented on 2026-06-18 with a global network banner for offline, backend unavailable, and stale cached data states.

**Why fourth:** iPhone/PWA users need clear state when the app is stale, offline, or waiting on the backend.

**Files:**
- Modify: `apps/frontend/src/lib/api.ts`
- Modify: `apps/frontend/src/lib/use-client-cache.ts`
- Modify: shared layout/status components
- Add frontend `node:test` coverage for cache/error helpers

- [x] Add a small global network status surface: offline, reconnecting, backend unavailable.
- [x] Show stale data as stale instead of silently pretending it is fresh.
- [x] Keep `/api/` out of service-worker cache.
- [x] Make failed requests show actionable text instead of indefinite loading.
- [x] Verification: run frontend helper tests, `pnpm --filter @inversiones/frontend lint`, and `pnpm --filter @inversiones/frontend build`.

## Phase 5: Minimal End-To-End Coverage

**Status:** Implemented on 2026-06-18 with a backend e2e flow covering login, client creation, loan creation, payment registration, dashboard verification, and cleanup.

**Why fifth:** Once core behavior is stable, protect the main money flow.

**Files:**
- Create or modify: backend e2e tests under `apps/backend/test`
- Optionally create: frontend smoke test docs if browser automation is not available in CI

- [x] Cover login.
- [x] Cover create client.
- [x] Cover create loan.
- [x] Cover register payment.
- [x] Cover dashboard/report endpoint reflecting the payment.
- [x] Use a disposable database or deterministic seed data.
- [x] Verification: run `pnpm --filter backend test:e2e`.

## Phase 6: Observability

**Status:** Implemented on 2026-06-18 with request correlation IDs, structured exception logs, generic production errors, and troubleshooting docs.

**Why last:** Logging is most useful after the flows and failure modes are clear.

**Files:**
- Modify: `apps/backend/src/common/filters/all-exceptions.filter.ts`
- Modify: `apps/backend/src/main.ts`
- Create: `docs/operations-troubleshooting.md`

- [x] Add request/error correlation IDs.
- [x] Log backend errors with route, status, user id when available, and correlation id.
- [x] Keep client-facing errors generic where needed.
- [x] Document how to inspect Render/Supabase logs and common failure checks.
- [x] Verification: trigger one expected 401 and one validation error locally, confirm logs are useful and secrets are absent.

## Recommended Execution Order

1. Phase 1: Database Migrations And Backups
2. Phase 2: Permissions Review
3. Phase 3: Audit Coverage
4. Phase 4: Offline And Slow-Network UX
5. Phase 5: Minimal End-To-End Coverage
6. Phase 6: Observability

## Not In This Roadmap

- New product features.
- UI redesign.
- Refresh tokens.
- Multi-tenant architecture.
- Replacing Prisma, Supabase, NestJS, or Next.js.
