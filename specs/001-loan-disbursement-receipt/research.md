# Research: Recibo de desembolso de préstamo

## Receipt persistence

**Decision**: Store one `LoanReceipt` per loan with a unique `loanId`, a receipt number equal to the
already unique loan number, immutable JSON snapshot, generator and timestamp.

**Rationale**: Reuses the database's concurrency-safe loan number, avoids another hand-rolled
sequence, guarantees idempotency and preserves historical content.

**Alternatives considered**: A separate maximum-plus-one sequence was rejected because it requires
retry logic already solved by the loan sequence. Generating receipts only in the browser was
rejected because later edits would alter reprints.

## Creation flow

**Decision**: Add a `generateReceipt` boolean to loan creation, defaulting to `true`, and create the
snapshot inside the existing serializable loan transaction.

**Rationale**: The receipt never exists for a failed loan and the default matches the desired office
workflow while preserving an opt-out.

## Later generation

**Decision**: Add an idempotent `POST /loans/:id/receipt` plus `GET /loans/:id/receipt`.

**Rationale**: Loans created without a receipt can generate one later; repeated clicks return the
same receipt instead of duplicating it.

## Printing and PDF

**Decision**: Reuse `window.print` and the installed `html2pdf.js`; format content at 76 mm and render
original, copy or both from the same snapshot.

**Rationale**: Matches the Epson TM-U220II paper width and existing application behavior without
printer-specific SDKs or dependencies.

## Signatures

**Decision**: Print physical signature lines only.

**Rationale**: Two-part carbonless paper transfers a single handwritten signature. Digital
signature capture is explicitly outside the first version.

## Company identity

**Decision**: Persist the existing company settings form fields and copy their current values into
each receipt snapshot. Use `Inversiones Willians Marte` as the safe default name.

**Rationale**: Removes current hard-coded placeholder values and prevents historical receipts from
changing after company settings are edited.

## Amount in words

**Decision**: Implement one small, tested Spanish DOP conversion helper in the frontend receipt
module.

**Rationale**: No installed dependency provides this, and the bounded Dominican peso use case is
smaller than adding a package.
