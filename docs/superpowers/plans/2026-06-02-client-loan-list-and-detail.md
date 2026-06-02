# Client Loan List and Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace client loan cards with a compact responsive list and add a dedicated loan detail page with schedule inspection and loan-specific payment registration.

**Architecture:** Keep the client list based on the existing `LoanSummary[]`. Add pure loan presentation helpers for derived values, a focused detail page that loads `GET /loans/:id`, and a modal that submits directly to the existing `POST /payments` contract.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Axios API helpers, Node test runner.

---

### Task 1: Loan Presentation Helpers

**Files:**
- Create: `apps/frontend/src/components/loans/loan-detail.helpers.ts`
- Create: `apps/frontend/src/components/loans/loan-detail.helpers.test.ts`

- [x] **Step 1: Write failing helper tests**

Cover clamped progress, zero-term installments, non-negative schedule remainder, and totals derived from schedules and payments.

- [x] **Step 2: Run tests and verify RED**

Run: `cd apps/frontend && node --test --experimental-strip-types src/components/loans/loan-detail.helpers.test.ts`

- [x] **Step 3: Implement the helpers**

Add:

```ts
export function clampProgress(value: number): number;
export function getLoanProgress(principal: number, balance: number): number;
export function getRegularInstallment(totalAmount: number, term: number): number;
export function getScheduleRemaining(amount: number, paidAmount?: number | null): number;
export function getLoanDetailTotals(loan: LoanDetailLike): LoanDetailTotals;
```

- [x] **Step 4: Run tests and verify GREEN**

Run the same Node test command and confirm all helper tests pass.

### Task 2: Responsive Client Loan List

**Files:**
- Modify: `apps/frontend/src/components/clients/client-detail-page.tsx`

- [x] **Step 1: Replace individual loan cards**

Render one rounded container with clickable loan rows. Use `/prestamos/${loan.id}` links, desktop grid columns, and a compact vertical mobile layout.

- [x] **Step 2: Reuse tested helpers**

Use `getLoanProgress` and `getRegularInstallment` for row values and preserve the existing empty state.

### Task 3: Loan Detail Data Contract and Modal

**Files:**
- Modify: `apps/frontend/src/lib/api/loans.ts`
- Create: `apps/frontend/src/components/loans/register-payment-modal.tsx`

- [x] **Step 1: Add typed loan detail API contract**

Define `LoanDetail`, `LoanScheduleItem`, and `LoanDetailPayment`, then return `Promise<LoanDetail>` from `getLoan`.

- [x] **Step 2: Add loan-specific payment modal**

Build controlled fields for amount, method, date, reference, and notes. Call the provided submit handler, disable submission while saving, and render API errors without clearing values.

### Task 4: Loan Detail Page

**Files:**
- Create: `apps/frontend/src/app/prestamos/[id]/page.tsx`
- Create: `apps/frontend/src/components/loans/loan-detail-page.tsx`

- [x] **Step 1: Add route wrapper**

Read the App Router `id` param and render `<LoanDetailPage loanId={id} />`.

- [x] **Step 2: Add detail UI**

Load `getLoan(loanId)`, show back link, header, `Registrar cobro`, summary cards, progress, and schedule table. On modal submission call `createPayment`, close the modal, and reload the loan.

### Task 5: Verification

- [x] **Step 1: Run focused helper tests**

Run: `cd apps/frontend && node --test --experimental-strip-types src/components/loans/loan-detail.helpers.test.ts`

- [ ] **Step 2: Run frontend lint**

Run: `pnpm --filter @inversiones/frontend lint`

- [x] **Step 3: Run frontend build**

Run: `pnpm --filter @inversiones/frontend build`

- [x] **Step 4: Inspect git diff**

Confirm only scoped files changed and preserve pre-existing local edits in the new-loan form.
