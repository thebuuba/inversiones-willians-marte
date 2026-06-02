# Client Loan Row Number, Portfolio, and Status Design

## Objective

Make each loan row in the client detail page operationally useful for collections and future payment receipts by showing a global numeric loan identifier, an optional portfolio name, and a time-based collection status.

## Scope

This change covers:

- A globally increasing numeric identifier for every loan.
- Backfilling identifiers for existing loans.
- Exposing loan number, portfolio, and schedule data in the client detail response.
- Updating the client `Préstamos` tab row content.
- Deriving the visible collection status from pending schedule rows and the current date.

This change does not alter payment allocation, late-fee calculations, receipt generation, the dedicated loan detail page layout, or the general loans table.

## Global Loan Number

Add `loanNumber` to the `Loan` model:

- PostgreSQL column: `loan_number`.
- Type: integer.
- Constraint: unique.
- Sequence: global and increasing across all clients and portfolios.

The migration creates a PostgreSQL sequence, assigns existing loans a number ordered by creation date and UUID for deterministic ties, sets the sequence as the default for new rows, and adds the unique constraint. Numbers start at `1` and are not reused if a loan is deleted.

The existing UUID remains the internal primary key and continues to be used in routes and API operations. The numeric loan number is the visible operational identifier.

## Client Detail Response

Extend the client detail loan query to include:

- `portfolio` with `id` and `name`.
- `schedule` with `dueDate`, `status`, `amount`, and `paidAmount`.

Extend `LoanSummary` with:

- `loanNumber`.
- Optional `portfolio`.
- Optional summary schedule rows.

## Loan Row Content

Replace the product heading with:

```text
Préstamo #<loanNumber>
```

If the loan belongs to a portfolio, show the portfolio name as secondary text. If it does not belong to a portfolio, omit that line.

Keep:

- Term and payment frequency.
- Start date.
- Principal.
- Outstanding balance.
- Progress.
- Regular installment.
- Status badge.

## Visible Collection Status

Calculate the badge from schedule rows that are not fully paid. Compare dates by calendar day, not by current hour.

Rules, in priority order:

1. `Vencido`: finite loan only, end date has passed, balance remains above zero.
2. `Atrasado`: the oldest unpaid due date passed more than five calendar days ago.
3. `Pendiente`: the oldest unpaid due date is today or passed at most five calendar days ago.
4. `A tiempo`: no unpaid due date has arrived yet.

For `INDEFINITE` loans:

- Never show `Vencido`.
- Use `A tiempo`, `Pendiente`, or `Atrasado` from the same five-day grace rule.

If schedule data is unavailable, fall back conservatively:

- `Vencido` for a finite loan whose end date passed with outstanding balance.
- `A tiempo` otherwise.

## Testing

Add focused frontend helper tests for:

- Future installment: `A tiempo`.
- Due today: `Pendiente`.
- Due five days ago: `Pendiente`.
- Due six days ago: `Atrasado`.
- Finite loan past end date with balance: `Vencido`.
- Indefinite loan past its schedule due date: never `Vencido`.
- Paid rows do not influence status.

Add a backend client service test confirming the client detail query includes portfolio and schedule fields.

Run:

- Focused frontend helper tests.
- Focused backend client service tests.
- Prisma generation.
- Frontend build.
- Backend build.
- Scoped lint on changed frontend files.
