# Data Model: Recibo de desembolso

## LoanReceipt

- `id`: immutable identifier
- `loanId`: unique reference to the originating loan
- `receiptNumber`: unique stable number, copied from `Loan.loanNumber`
- `snapshot`: immutable receipt payload
- `generatedById`: user who generated the receipt
- `createdAt`: issuance timestamp

Relationship: one loan has zero or one receipt; deleting a loan deletes its receipt.

## Receipt snapshot

- Company: commercial name, tax identifier, phone, email and address
- Client: identifier, full name and identification number
- Loan: number, product, operation type, principal, disbursed amount, frequency, term, first payment
  date, purpose and creation date
- Issuance: receipt number, issue date and generator name

Validation:

- All money values are stored as numbers rounded to two decimals.
- Receipt and loan identifiers are required.
- Missing optional company/client data is represented as `null`, not fabricated.
- Snapshot content never updates after issuance.

## SystemSettings additions

- `companyName`: defaults to `Inversiones Willians Marte`
- `companyTaxId`: optional
- `companyEmail`: optional
- `companyPhone`: optional
- `companyAddress`: optional

## State transitions

```text
Loan created without receipt -> receipt absent -> generate -> receipt issued
Loan created with receipt -> receipt issued
Receipt issued -> view / print / download -> receipt remains unchanged
```
