# Navigation Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce navigation delay caused by broken reporting, repeated blocking loads, cumulative animations, and missing database indexes.

**Architecture:** Fix the report query at its source, extend the existing lightweight client cache into stale-while-revalidate behavior, centralize bounded animation delay, and add focused PostgreSQL indexes for current query patterns. Keep each change narrow and verify latency after applying the migration.

**Tech Stack:** Prisma, PostgreSQL, NestJS, Jest, Next.js, React, Framer Motion, TypeScript.

---

### Task 1: Monthly Collections Regression

**Files:**
- Create: `apps/backend/src/modules/reports/reports.service.spec.ts`
- Modify: `apps/backend/src/modules/reports/reports.service.ts`

- [x] Write a failing Jest test proving the report binds the six-month cutoff.
- [x] Run the focused test to verify RED.
- [x] Replace the raw `$1` placeholder with Prisma interpolation.
- [x] Run the focused test and authenticated endpoint to verify GREEN.

### Task 2: Bounded List Animations

**Files:**
- Create: `apps/frontend/src/lib/animation.ts`
- Create: `apps/frontend/src/lib/animation.test.ts`
- Modify: list panels with index-based entry animation.

- [x] Write a failing Node test for capped delay.
- [x] Run the focused test to verify RED.
- [x] Add the delay helper and apply it to cumulative list animations.
- [x] Run frontend helper tests.

### Task 3: Navigation Cache

**Files:**
- Modify: `apps/frontend/src/lib/use-client-cache.ts`
- Modify: `apps/frontend/src/components/clients/clients-panel.tsx`
- Modify: `apps/frontend/src/components/loans/loans-page.tsx`
- Modify: `apps/frontend/src/components/investors/investors-panel.tsx`

- [x] Preserve cached data during background revalidation.
- [x] Deduplicate in-flight requests.
- [x] Adopt stable cache keys for list filters and pagination.
- [x] Verify frontend lint and build.

### Task 4: Database Indexes

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260602160000_add_performance_indexes/migration.sql`

- [x] Add indexes aligned with current joins, filters, and ordering.
- [x] Validate Prisma schema.
- [x] Apply the migration to the configured database.

### Task 5: Final Verification

- [x] Run backend tests and build.
- [x] Run frontend helper tests, lint, and build.
- [x] Run `git diff --check`.
- [x] Measure authenticated APIs and verify monthly collections returns `200`.
