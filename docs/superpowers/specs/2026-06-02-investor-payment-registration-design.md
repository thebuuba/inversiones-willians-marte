# Investor Payment Registration Screen

## Problem

The investor detail page has a "Registrar pago" button pointing to `/inversionistas/pago`, but the route does not exist. There is no way to record interest payments made to investors. The "Historial de pagos" tab and "Total pagado" stat on the detail page are both placeholders.

## Solution

A new two-column page at `/inversionistas/pago?investorId=xxx` with investor information on the left and a payment form on the right. Backed by a new `InvestorPayment` model and `InvestorPaymentsModule`.

## Data Model

### Prisma: `InvestorPayment`

```prisma
model InvestorPayment {
  id            String   @id @default(uuid())
  investorId    String   @map("investor_id")
  amount        Decimal
  periodMonth   Int      @map("period_month")
  periodYear    Int      @map("period_year")
  paymentDate   DateTime @map("payment_date")
  paymentMethod String?
  reference     String?
  notes         String?
  receivedById  String   @map("received_by")
  createdAt     DateTime @default(now()) @map("created_at")

  investor   Investor @relation(fields: [investorId], references: [id])
  receivedBy User     @relation(fields: [receivedById], references: [id])

  @@unique([investorId, periodMonth, periodYear])
  @@index([investorId])
  @@index([paymentDate])
  @@map("investor_payments")
}
```

A `@@unique` constraint on `(investorId, periodMonth, periodYear)` prevents duplicate payments for the same period.

### Shared Types

```typescript
interface CreateInvestorPaymentDto {
  investorId: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

interface InvestorPaymentItem extends CreateInvestorPaymentDto {
  id: string;
  receivedById: string;
  receivedBy?: { id: string; name: string };
  createdAt: string;
}
```

## Backend: `InvestorPaymentsModule`

New module following the existing `PaymentsModule` pattern.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/investor-payments` | ADMIN, COLLECTOR | Register a payment |
| `GET` | `/investor-payments/:investorId` | ADMIN, COLLECTOR | Get all payments for an investor |
| `GET` | `/investor-payments/check?investorId=&periodMonth=&periodYear=` | ADMIN, COLLECTOR | Check if a period is already paid |

### POST body (`CreateInvestorPaymentDto`)

```json
{
  "investorId": "uuid",
  "amount": 10000,
  "periodMonth": 6,
  "periodYear": 2026,
  "paymentDate": "2026-06-02",
  "paymentMethod": "Efectivo",
  "reference": "Recibo #123",
  "notes": "Pago de junio"
}
```

### Service logic

`create()`: validates investor exists, checks the `@@unique` constraint (Prisma throws `P2002` on duplicate), creates the payment record.

`findByInvestor(investorId)`: returns all payments for an investor ordered by `periodYear, periodMonth DESC`.

`checkPeriod(investorId, periodMonth, periodYear)`: returns the payment if one exists for that period, or null.

## Frontend: Page at `/inversionistas/pago`

### Route

```
apps/frontend/src/app/inversionistas/pago/page.tsx
```

Receives `investorId` as query parameter. If missing, redirects to `/inversionistas`.

### Component: `apps/frontend/src/components/investors/register-investor-payment-page.tsx`

Two-column layout:

**Left column: Investor information**
- Card with avatar/icon, name, code, status badge
- Info list: capital invertido, tasa mensual, retorno mensual (cuota = capital * rate / 100), próximo período, estado del período (Pendiente/Pagado)
- Timeline of last 5 payments (or empty state)

**Right column: Payment form**
- Period selector (month dropdown + year dropdown). Defaults to current month/year.
- On period change: calls `GET /check` to see if already paid. If paid, shows message and disables form. If not, auto-fills amount with calculated cuota.
- Amount field (pre-filled, editable) with RD$ prefix
- Payment date (defaults to today)
- Payment method dropdown (Efectivo, Transferencia, Tarjeta)
- Reference (optional)
- Notes (optional)
- [Cancelar] and [Registrar pago] buttons

### Form validation

- Amount must be > 0
- Payment date required
- Period must be valid (month 1-12, year >= 2020)
- On submit: show saving state, call `POST /investor-payments`, on success redirect to investor detail page

### API client: `lib/api/investor-payments.ts`

```typescript
createInvestorPayment(dto) → POST /investor-payments
getInvestorPayments(investorId) → GET /investor-payments/:investorId
checkInvestorPaymentPeriod(investorId, month, year) → GET /investor-payments/check?...
```

## Future considerations (out of scope)

- Wire up "Total pagado" stat and "Historial de pagos" tab on investor detail page
- Export functionality for investor payments
- Payment reminders / scheduling
