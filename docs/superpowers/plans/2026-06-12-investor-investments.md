# Investor Investments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split investor people from their individual investments so each person can own multiple investments with independent capital, payments, and overdue status.

**Architecture:** Add investment and capital movement models under investors. Payments move from investor-level period uniqueness to investment-level period uniqueness. The frontend reads investor detail with investment summaries and routes payment/detail actions by `investmentId`.

**Tech Stack:** Prisma/Postgres, NestJS, Next.js, TypeScript, pnpm, node:test/Jest.

---

### Task 1: Database Model And Migration

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260612160000_add_investor_investments/migration.sql`

- [ ] Add `InvestorInvestmentStatus` and `InvestorInvestmentMovementType` enums.
- [ ] Add `InvestorInvestment` with `investorId`, `code`, `capital`, `monthlyPayment`, `rate`, `startDate`, `term`, `status`, `notes`, `createdById`, timestamps, and relations.
- [ ] Add `InvestorInvestmentMovement` with `investmentId`, `type`, `amount`, `movementDate`, `notes`, `createdById`, `createdAt`, and relations.
- [ ] Add nullable `investmentId` to `InvestorPayment` and update relations.
- [ ] Migration SQL creates one initial investment per existing investor and backfills payments to that investment.
- [ ] Migration SQL changes investor payment uniqueness to `(investment_id, period_month, period_year)`.
- [ ] Run `pnpm --filter @inversiones/database build`.

### Task 2: Shared Types

**Files:**
- Modify: `packages/shared/src/index.ts`

- [ ] Add investment status and payment status types.
- [ ] Add `InvestorInvestmentItem`, `InvestorInvestmentDetail`, `CreateInvestorInvestmentDto`, and `AddInvestorCapitalDto`.
- [ ] Change payment DTO/item to include `investmentId` while keeping optional `investorId` for temporary compatibility.
- [ ] Extend `InvestorItem` with optional `investments`, `totalCapital`, `totalMonthlyReturn`, and `activeInvestments`.
- [ ] Run `pnpm --filter @inversiones/shared build`.

### Task 3: Backend Investments Module

**Files:**
- Create: `apps/backend/src/modules/investments/investments.module.ts`
- Create: `apps/backend/src/modules/investments/investments.controller.ts`
- Create: `apps/backend/src/modules/investments/investments.service.ts`
- Create: `apps/backend/src/modules/investments/dto/create-investment.dto.ts`
- Create: `apps/backend/src/modules/investments/dto/add-capital.dto.ts`
- Create: `apps/backend/src/modules/investments/investments.service.spec.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add create/list/detail/capital-addition endpoints.
- [ ] Implement monthly payment calculation as `capital * rate / 100`.
- [ ] Implement current period status using start-day monthly due date.
- [ ] Add tests for status, creation, and capital addition.
- [ ] Run `pnpm --filter backend test -- investments.service.spec.ts`.

### Task 4: Backend Investors And Payments Compatibility

**Files:**
- Modify: `apps/backend/src/modules/investors/investors.service.ts`
- Modify: `apps/backend/src/modules/investor-payments/dto/create-investor-payment.dto.ts`
- Modify: `apps/backend/src/modules/investor-payments/investor-payments.controller.ts`
- Modify: `apps/backend/src/modules/investor-payments/investor-payments.service.ts`
- Modify tests in the same modules.

- [ ] Investor create creates person plus initial investment.
- [ ] Investor update updates person fields and the first active investment for legacy edit flows.
- [ ] Investor list/detail include investment summaries and aggregate totals.
- [ ] Investor payments create/check/list use `investmentId`.
- [ ] Keep old `investorId` compatibility only when exactly one active investment exists.
- [ ] Run backend investor/payment tests.

### Task 5: Frontend API And Investor Screens

**Files:**
- Create: `apps/frontend/src/lib/api/investments.ts`
- Modify: `apps/frontend/src/lib/api/investors.ts`
- Modify: `apps/frontend/src/lib/api/investor-payments.ts`
- Modify: `apps/frontend/src/components/investors/investors-panel.tsx`
- Modify: `apps/frontend/src/components/investors/investor-detail-page.tsx`
- Modify: `apps/frontend/src/app/inversionistas/nuevo/page.tsx`

- [ ] Add investment API client.
- [ ] List one row per investor/person using aggregate totals.
- [ ] Investor detail displays investments list with view/register payment/add capital actions.
- [ ] New investment from investor detail calls investment create instead of investor create.
- [ ] Existing investor edit still updates person/first legacy investment path.
- [ ] Run frontend lint/build.

### Task 6: Investment Detail And Payment Flow

**Files:**
- Create: `apps/frontend/src/app/inversiones/[investmentId]/page.tsx`
- Create: `apps/frontend/src/components/investors/investment-detail-page.tsx`
- Modify: `apps/frontend/src/components/investors/register-investor-payment-page.tsx`

- [ ] Add investment detail page with summary, payments, movements, and add-capital form.
- [ ] Register payment page accepts `investmentId`, displays investor + investment code, and posts payment by investment.
- [ ] Keep old investor payment link compatibility by resolving the single active investment when needed.
- [ ] Run frontend lint/build.

### Task 7: Final Verification

**Files:**
- All changed files.

- [ ] Run `pnpm --filter @inversiones/database build`.
- [ ] Run `pnpm --filter backend test`.
- [ ] Run `pnpm --filter backend build`.
- [ ] Run `pnpm --filter @inversiones/frontend lint`.
- [ ] Run `pnpm --filter @inversiones/frontend build`.
- [ ] Do not commit or push unless explicitly requested.
