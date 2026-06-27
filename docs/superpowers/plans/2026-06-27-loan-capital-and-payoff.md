# Loan Capital Additions And Payoff Quote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support capital additions and fair early payoff quotes for indefinite and fixed-rate loans.

**Architecture:** Add one persisted loan capital movement table, keep quote math in one pure backend service, expose minimal loan endpoints, and render one payoff card in the loan detail page. Existing payment registration stays unchanged; this feature calculates what should be collected, it does not auto-close loans yet.

**Tech Stack:** Prisma/Postgres, NestJS, class-validator, Next.js/React, existing axios API helpers, Jest.

---

### Files

- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260627162000_add_loan_capital_movements/migration.sql`
- Create: `apps/backend/src/modules/loans/dto/add-loan-capital.dto.ts`
- Create: `apps/backend/src/modules/loans/dto/payoff-quote.dto.ts`
- Create: `apps/backend/src/modules/loans/loan-payoff.service.ts`
- Create: `apps/backend/src/modules/loans/loan-payoff.service.spec.ts`
- Modify: `apps/backend/src/modules/loans/loans.module.ts`
- Modify: `apps/backend/src/modules/loans/loans.service.ts`
- Modify: `apps/backend/src/modules/loans/loans.controller.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/frontend/src/lib/api/loans.ts`
- Modify: `apps/frontend/src/components/loans/loan-detail-page.tsx`

### Rules

- [ ] A capital addition increases the current capital of an active loan and records history.
- [ ] The loan payment day stays anchored to the original loan cycle.
- [ ] Indefinite loans quote interest by daily proration across capital segments.
- [ ] Fixed-rate loans quote only earned interest; future unearned interest is discounted.
- [ ] Early payoff quote returns capital, earned interest, unearned interest discount, fees, and total.
- [ ] No automatic loan close in this pass.

### Task 1: Database Movement Table

- [ ] Add `LoanCapitalMovement` to `schema.prisma`:

```prisma
model LoanCapitalMovement {
  id            String   @id @default(uuid())
  loanId        String   @map("loan_id")
  amount        Decimal
  effectiveDate DateTime @map("effective_date")
  notes         String?
  createdById   String   @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")

  loan      Loan @relation(fields: [loanId], references: [id])
  createdBy User @relation(fields: [createdById], references: [id])

  @@index([loanId, effectiveDate])
  @@map("loan_capital_movements")
}
```

- [ ] Add `capitalMovements LoanCapitalMovement[]` to `Loan`.
- [ ] Add `loanCapitalMovements LoanCapitalMovement[]` to `User`.
- [ ] Create SQL migration:

```sql
CREATE TABLE "loan_capital_movements" (
  "id" TEXT NOT NULL,
  "loan_id" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "effective_date" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_capital_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loan_capital_movements_loan_id_effective_date_idx"
ON "loan_capital_movements"("loan_id", "effective_date");

ALTER TABLE "loan_capital_movements"
ADD CONSTRAINT "loan_capital_movements_loan_id_fkey"
FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loan_capital_movements"
ADD CONSTRAINT "loan_capital_movements_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Task 2: Payoff Math Service

- [ ] Implement `LoanPayoffService` with:

```ts
quote(loan, payoffDate): {
  payoffDate: string;
  capitalOutstanding: number;
  earnedInterest: number;
  unearnedInterestDiscount: number;
  fees: number;
  totalToPay: number;
  dailyInterest: number;
  daysGenerated: number;
}
```

- [ ] Use 30-day monthly proration, 15-day biweekly, 7-day weekly, 1-day daily.
- [ ] For fixed loans, use payment allocations to avoid charging already-paid principal/interest.
- [ ] For indefinite loans, include `loan.principal + capitalMovements` as capital and prorate additions from their effective date.

### Task 3: Backend Endpoints

- [ ] Add DTOs:

```ts
export class AddLoanCapitalDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  effectiveDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

```ts
export class PayoffQuoteDto {
  @IsString()
  payoffDate: string;
}
```

- [ ] Add endpoints:

```ts
POST /api/v1/loans/:id/capital-additions
GET /api/v1/loans/:id/payoff-quote?payoffDate=YYYY-MM-DD
```

- [ ] `POST capital-additions` updates `loan.principal`, `loan.balance`, writes `LoanCapitalMovement`, and writes an audit log.

### Task 4: Frontend Card

- [ ] Add `getPayoffQuote()` and `addLoanCapital()` in `apps/frontend/src/lib/api/loans.ts`.
- [ ] Add one card in `loan-detail-page.tsx` sidebar:

```txt
Saldo anticipado
Fecha de saldo [date]
Capital pendiente
Interés generado
Interés futuro descontado
Total para saldar
```

- [ ] Add compact capital addition form only for active loans:

```txt
Agregar capital
Monto
Fecha efectiva
Notas
```

### Task 5: Verification

- [ ] Run backend unit tests:

```bash
pnpm --filter backend test -- loan-payoff.service.spec.ts
```

- [ ] Run full backend tests:

```bash
pnpm --filter backend test
```

- [ ] Run frontend lint:

```bash
pnpm --filter @inversiones/frontend lint
```

- [ ] Smoke test:

```bash
curl http://localhost:3000/api/v1/loans/<id>/payoff-quote?payoffDate=2026-07-10
```
