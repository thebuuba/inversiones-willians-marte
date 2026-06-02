# Client Loan List and Detail Page Design

## Objective

Replace the individual loan cards in the client `Préstamos` tab with a single compact list and add a dedicated loan detail page where users can inspect the repayment schedule and register a payment.

## Scope

This change covers:

- The `Préstamos` tab in the client detail page.
- Navigation from a client loan row to `/prestamos/[id]`.
- A new loan detail page.
- A loan-specific payment modal.
- Refreshing the loan detail after a successful payment.

This change does not modify the general loans page, the general cash movement modal, backend payment allocation rules, or loan creation.

## Client Loan List

Use one white rounded container for all loans. Each desktop row contains:

- Product icon and product name.
- Term, payment frequency, and start date.
- Principal.
- Outstanding balance.
- Payment progress bar and percentage.
- Regular installment amount.
- Status badge.

Rows use subtle separators and a hover state. The entire row is clickable and navigates to `/prestamos/[id]`.

For small screens, each row becomes a compact vertical block within the same list container. It preserves all information without horizontal scrolling.

If the client has no loans, preserve the existing empty-state message.

## Loan Detail Page

Create `/prestamos/[id]` with:

- A back link to the originating client's detail page.
- Product name, client name, payment frequency, and status.
- A top-right `Registrar cobro` button.
- Summary cards for principal, outstanding balance, total paid, and regular installment.
- A payment progress bar with percentage and installment counts.
- A repayment schedule table.

The schedule table displays installment number, due date, amount, amount paid, remaining amount, and status. On small screens, the table may use horizontal scrolling so financial columns remain readable.

The page uses the existing `GET /loans/:id` endpoint, which already returns the client, product, schedule, and payments. Summary values are derived from that response so loading the page does not require a second summary request.

## Register Payment Modal

The `Registrar cobro` button opens a payment modal already associated with the current loan and client. It does not ask users to search for a client or select a loan.

The modal includes:

- Amount.
- Payment method.
- Payment date.
- Optional reference.
- Optional notes.

Submitting calls the existing `POST /payments` endpoint. After a successful payment, close the modal and reload the loan detail so the balance, progress, payments, and schedule statuses reflect the new payment.

Disable submission while saving. Surface API errors inside the modal and preserve the entered values so the user can correct or retry.

## Data Flow

1. The client tab receives `LoanSummary[]` from the existing client detail request.
2. Clicking a list row navigates to `/prestamos/[id]`.
3. The loan detail page calls `getLoan(id)`.
4. The payment modal submits `createPayment({ loanId, clientId, amount, paymentDate, paymentMethod, reference, notes })`.
5. A successful payment triggers a fresh `getLoan(id)` request.

## Testing

Add focused tests for pure presentation helpers:

- Progress is clamped between `0` and `100`.
- Regular installment handles an empty or zero term safely.
- Schedule row remaining amount never becomes negative.
- Loan detail totals derive correctly from payments and schedule rows.

Run frontend helper tests, lint, and build. Verify the client loans tab and loan detail page in the local browser when the app can be started with its required backend.
