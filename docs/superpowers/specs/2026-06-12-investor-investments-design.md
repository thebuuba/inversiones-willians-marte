# Investor Investments Design

## Context

The current investor module treats an investor record as both the person and the investment. That causes ambiguity when the same person makes another investment: the system either edits the existing record or duplicates the person as another investor.

The approved model separates the person from each investment:

- `Investor`: the person/profile.
- `InvestorInvestment`: one investment belonging to an investor.
- `InvestorPayment`: a payment for one specific investment.
- `InvestorInvestmentMovement`: capital movements for one specific investment.

No implementation should continue relying on duplicated investor rows to represent multiple investments by the same person.

## Goals

- Allow one investor/person to own multiple investments.
- Show all investments inside the investor detail page.
- Allow opening a specific investment detail page.
- Register payments against a specific investment.
- Add capital to an existing investment as a movement, increasing that investment capital.
- Show whether each investment is paid, pending, or overdue for the current period.
- Preserve existing data through a migration by creating an initial investment for each existing investor.

## Non-Goals

- Do not implement capital withdrawals unless needed later.
- Do not build accounting ledgers beyond investment capital movements and payments.
- Do not redesign unrelated investor screens beyond what is needed for the new model.
- Do not change loan/client/payment modules outside investor-specific integrations.

## Data Model

### Investor

`Investor` becomes the person/profile record.

Keep person-level fields:

- `id`
- `code`
- `name`
- `email`
- `phone`
- `phone2`
- `cedula`
- `birthDate`
- `nationality`
- `type`
- `photo`
- `bank`
- `status`
- `notes`
- `createdById`
- timestamps

Financial fields currently on `Investor` become legacy/migration fields or are removed after the migration path is complete:

- `capital`
- `monthlyPayment`
- `rate`
- `startDate`
- `term`

During the implementation, the preferred read path should be through investments, not those legacy fields.

### InvestorInvestment

New table/model for each investment:

- `id`
- `investorId`
- `code`
- `capital`
- `monthlyPayment`
- `rate`
- `startDate`
- `term`
- `status`
- `notes`
- `createdById`
- `createdAt`
- `updatedAt`

Suggested statuses:

- `ACTIVE`
- `PAUSED`
- `CLOSED`

The monthly return is calculated from the monthly percentage rate:

```text
monthlyPayment = capital * (rate / 100)
```

When capital is added, `capital` and `monthlyPayment` are recalculated for that investment.

### InvestorInvestmentMovement

New table/model for capital movements:

- `id`
- `investmentId`
- `type`
- `amount`
- `movementDate`
- `notes`
- `createdById`
- `createdAt`

Initial supported type:

- `CAPITAL_ADDITION`

This keeps a history when capital is added to an existing investment.

### InvestorPayment

Payments should point to `investmentId`.

Fields remain generally the same:

- `id`
- `receiptNumber`
- `investmentId`
- `amount`
- `periodMonth`
- `periodYear`
- `paymentDate`
- `paymentMethod`
- `reference`
- `notes`
- `receivedById`
- `createdAt`

The uniqueness rule becomes:

```text
unique(investmentId, periodMonth, periodYear)
```

This allows one investor/person to receive multiple payments in the same month if they have multiple active investments.

## Overdue Rule

Use the investment start date as the recurring monthly due day.

Example:

- Start date: July 3, 2026.
- July period due date: July 3, 2026.
- August period due date: August 3, 2026.
- September period due date: September 3, 2026.

Status for the current period:

- `PAID`: payment exists for current period.
- `PENDING`: payment does not exist and current due date has not passed.
- `OVERDUE`: payment does not exist and current due date has passed.

If the start day does not exist in a month, use the last day of that month.

## Backend API

### Investors

Existing investor endpoints continue to manage the person/profile.

Recommended investor detail response should include:

- person fields
- aggregate capital across active investments
- active investment count
- investments summary list

### Investments

Add investment endpoints:

- `POST /investors/:investorId/investments`
  Creates a new investment under an existing investor.

- `GET /investors/:investorId/investments`
  Lists all investments for one investor.

- `GET /investments/:investmentId`
  Returns one investment with payment and movement summaries.

- `PATCH /investments/:investmentId`
  Updates investment terms such as rate, start date, term, notes, and status.

- `POST /investments/:investmentId/capital-additions`
  Adds capital to the investment and records an `InvestorInvestmentMovement`.

### Payments

Payment endpoints should accept and use `investmentId`.

- `POST /investor-payments`
  Registers payment for one investment.

- `GET /investor-payments/investment/:investmentId`
  Lists payments for one investment.

- `GET /investor-payments/check`
  Checks a period for one investment.

During migration, old `investorId` payment calls may be supported temporarily only if they can resolve to one active investment. If an investor has multiple active investments, the API should require `investmentId`.

## Frontend UX

### Investors List

Show one row per person.

Suggested columns:

- code
- name
- cedula/phone
- total active capital
- active investments count
- total monthly return
- status
- actions

### Investor Detail

Top area: person information.

Main area: investments list.

Each investment card/row should show:

- investment code
- current capital
- rate
- monthly return
- start date
- next due date
- payment status: paid, pending, overdue
- buttons: view detail, register payment, add capital

The existing "Nueva inversion" button should create a new investment under the same person, not edit the person.

### Investment Detail

Shows one investment.

Sections:

- summary: capital, rate, monthly return, start date, term, status
- current period payment status
- action buttons: register payment, add capital, pause/close
- payment history
- capital movement history

### Register Payment

The register payment page should be investment-based:

- It receives `investmentId`.
- It shows the parent investor name plus the investment code.
- The default amount is the investment monthly payment.
- It checks whether that investment period is already paid.

### Add Capital

The add capital flow should:

- ask for amount, date, and note
- create a capital movement
- increase investment capital
- recalculate monthly payment using the investment rate
- show the movement in investment history

## Migration Plan

1. Create `InvestorInvestment`.
2. Create `InvestorInvestmentMovement`.
3. Add nullable `investmentId` to existing `InvestorPayment`.
4. For every existing `Investor`, create one initial `InvestorInvestment` using existing investor financial fields.
5. Backfill existing payments to the created initial investment.
6. Make `InvestorPayment.investmentId` required after backfill.
7. Update uniqueness from `(investorId, periodMonth, periodYear)` to `(investmentId, periodMonth, periodYear)`.
8. Keep person data on `Investor`.
9. Stop reading financial fields from `Investor` in new frontend/backend code.

## Testing

Backend:

- Creating an investment under an investor.
- Listing investments for an investor.
- Registering payments by investment.
- Rejecting duplicate period payment for the same investment.
- Allowing same period payments for two different investments under the same investor.
- Calculating paid, pending, and overdue status.
- Adding capital and recalculating monthly return.

Frontend:

- Investor detail shows multiple investments.
- "Nueva inversion" creates an investment, not an edited investor.
- Register payment page uses `investmentId`.
- Add capital updates visible capital and monthly return after refresh.

Existing checks:

- Frontend lint/build.
- Backend lint/build/tests.

## Implementation Notes

- The codebase currently has `Investor` financial fields used by several screens. Implementation should migrate screen by screen to investment data.
- The first implementation should prefer compatibility adapters where needed, but the new behavior must use investment records as the source of truth.
- Existing local `.env.local` changes are intentionally local and should not be committed.
