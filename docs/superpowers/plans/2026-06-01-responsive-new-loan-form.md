# Responsive New Loan Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/prestamos/nuevo` compact, responsive at 100% zoom, validation-aware, and capable of showing every calculated installment inside a conditionally scrolling table.

**Architecture:** Keep the existing screen and calculation logic in `new-loan-page.tsx`. Extract a small pure helper for calculation readiness so the disabled-button behavior can be verified independently, then reorganize the JSX without changing the backend contract.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Node test runner, ESLint

---

### Task 1: Calculation Readiness Helper

**Files:**
- Create: `apps/frontend/src/components/loans/new-loan-form.helpers.ts`
- Create: `apps/frontend/src/components/loans/new-loan-form.helpers.test.ts`

- [ ] Add a failing Node test asserting that calculation remains disabled until amount, non-negative interest, positive term, amortization, frequency, and first payment date are valid.
- [ ] Run `node --test apps/frontend/src/components/loans/new-loan-form.helpers.test.ts` and confirm the missing helper failure.
- [ ] Implement `canCalculateLoan()` as a pure typed helper.
- [ ] Re-run the Node test and confirm it passes.

### Task 2: Responsive Main Information Card

**Files:**
- Modify: `apps/frontend/src/components/loans/new-loan-page.tsx`

- [ ] Remove the `Nuevo préstamo` eyebrow and reduce `Crear préstamo` to a normal page title.
- [ ] Move amortization, frequency, and first-payment-date controls into `MainInfoCard`.
- [ ] Replace amortization option buttons with a select list.
- [ ] Remove the separate `PaymentConfigCard`.
- [ ] Use responsive grids that wrap cleanly at 100% browser zoom.
- [ ] Disable `Calcular préstamo` through `canCalculateLoan()`.

### Task 3: Complete Scrollable Schedule

**Files:**
- Modify: `apps/frontend/src/components/loans/new-loan-page.tsx`

- [ ] Remove abbreviated six-row rendering and the expansion button.
- [ ] Render every installment.
- [ ] Let the schedule grow naturally up to `max-h-[400px]`, then apply internal vertical scrolling.
- [ ] Keep horizontal scrolling for narrow viewports.

### Task 4: Verification

- [ ] Run `node --test apps/frontend/src/components/loans/new-loan-form.helpers.test.ts`.
- [ ] Run `pnpm --filter @inversiones/frontend lint`.
- [ ] Run `pnpm --filter @inversiones/frontend build`.
- [ ] Verify `http://localhost:3001/prestamos/nuevo` loads successfully.

