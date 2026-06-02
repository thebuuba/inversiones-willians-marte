# Client Loan Row Number, Portfolio, and Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a global numeric loan identifier, optional portfolio name, and schedule-derived collection state in each client loan row.

**Architecture:** Add a database-backed `loanNumber` sequence while preserving UUID routes. Expand the client detail query with portfolio and schedule summaries, then calculate the visible collection badge with a pure frontend helper using calendar-day rules.

**Tech Stack:** Prisma, PostgreSQL migration SQL, NestJS, Next.js, React, TypeScript, Node test runner, Jest.

---

### Task 1: Collection Status Helper

**Files:**
- Modify: `apps/frontend/src/components/loans/loan-detail.helpers.test.ts`
- Modify: `apps/frontend/src/components/loans/loan-detail.helpers.ts`

- [x] **Step 1: Add failing tests**

Cover future, today, five-day grace, six-day overdue, finite expired, indefinite non-expired, and paid-row exclusion cases.

- [x] **Step 2: Run tests and verify RED**

Run: `cd apps/frontend && node --test --experimental-strip-types src/components/loans/loan-detail.helpers.test.ts`

- [x] **Step 3: Implement `getLoanCollectionStatus`**

Use calendar-day comparisons and return `'A tiempo' | 'Pendiente' | 'Atrasado' | 'Vencido'`.

- [x] **Step 4: Run tests and verify GREEN**

Run the same Node test command.

### Task 2: Global Loan Number

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260602120000_add_global_loan_number/migration.sql`

- [x] **Step 1: Add `loanNumber` schema field**

Use `Int @unique @default(autoincrement()) @map("loan_number")`.

- [x] **Step 2: Add deterministic SQL migration**

Create a sequence, backfill loans ordered by `created_at, id`, set the sequence default, set `NOT NULL`, and create the unique index.

- [x] **Step 3: Generate Prisma client**

Run: `pnpm --filter @inversiones/database generate`

### Task 3: Client Detail Contract

**Files:**
- Modify: `apps/backend/src/modules/clients/clients.service.spec.ts`
- Modify: `apps/backend/src/modules/clients/clients.service.ts`
- Modify: `packages/shared/src/index.ts`

- [x] **Step 1: Add failing backend query test**

Assert `findOne` includes portfolio identity and schedule status fields.

- [x] **Step 2: Run backend test and verify RED**

Run: `pnpm --filter backend test -- clients.service.spec.ts --runInBand`

- [x] **Step 3: Expand client detail query**

Include `portfolio: { select: { id: true, name: true } }` and ordered schedule summary fields.

- [x] **Step 4: Expand shared `LoanSummary`**

Add `loanNumber`, optional portfolio, and optional schedule summary rows.

- [x] **Step 5: Run backend test and verify GREEN**

Run the same Jest command.

### Task 4: Client Loan Row UI

**Files:**
- Modify: `apps/frontend/src/components/clients/client-detail-page.tsx`

- [x] **Step 1: Replace product heading**

Render `Préstamo #${loan.loanNumber}` and conditionally render `loan.portfolio?.name`.

- [x] **Step 2: Replace stored status badge mapping**

Use `getLoanCollectionStatus(loan, new Date())`.

### Task 5: Verification

- [x] **Step 1: Run focused frontend helper tests**
- [x] **Step 2: Run focused backend client test**
- [x] **Step 3: Run Prisma generation**
- [x] **Step 4: Run scoped frontend lint**
- [x] **Step 5: Run frontend build**
- [x] **Step 6: Run backend build**
- [x] **Step 7: Run `git diff --check` and inspect changed files**
