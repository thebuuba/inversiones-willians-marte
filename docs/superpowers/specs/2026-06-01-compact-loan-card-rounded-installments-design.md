# Compact Loan Card and Rounded Installments Design

## Objective

Make the loan parameter card easier to scan by reducing its vertical height, and ensure automatically calculated installments use rounded amounts that are simple to collect.

## Scope

This change covers:

- The loan parameter card in step 2 of the new-loan wizard.
- Automatic installment calculations in the frontend preview.
- Persisted automatic installment schedules in the backend.
- Focused tests for rounding and schedule balancing.

This change does not align every existing loan-wizard field with the backend contract. Existing inconsistencies involving custom interest, selected frequency, purpose, and the frontend-only indefinite mode should be handled separately unless they directly block the requested behavior.

## Visual Design

Use the approved **compact balanced** layout:

- Keep the existing two-column structure on medium and larger screens.
- Reduce card padding, section spacing, field gaps, input heights, label spacing, and textarea height.
- Keep all existing fields and controls visible.
- Preserve the current responsive single-column layout on small screens.
- Keep the visual hierarchy and existing color palette.

The goal is an approximately 30% shorter parameter card without making the form dense or difficult to scan.

## Installment Rounding Rules

Add a reusable rounding rule:

```ts
Math.round(value / 100) * 100
```

Examples:

- `210 -> 200`
- `290 -> 300`
- `250 -> 300`

Apply rounding only to installments calculated automatically by the system. If the user enters a custom installment amount, preserve that exact amount.

### Simple Amortization

- Round each automatically calculated regular installment to the nearest hundred.
- Recalculate principal and interest allocation using the rounded installment.
- Adjust the final installment as needed to close the remaining balance exactly.
- The final installment may differ from the rounded regular amount.

### Indefinite Amortization

- Round the calculated periodic interest installment to the nearest hundred.
- Keep the rounded installment fixed for every displayed period.
- Keep principal unchanged.
- Treat the rounded amount as the collected periodic interest amount.

### No-Interest Amortization

- Preserve the current behavior. Automatic centenary rounding is not part of this request.

## Frontend Data Flow

- The loan preview must derive the summary and schedule from one calculation path to avoid divergent totals.
- The amortization table must display the rounded regular installment and any final adjustment.
- The summary must reflect the totals produced by the schedule.
- A manually entered installment amount bypasses automatic installment rounding.

## Backend Data Flow

- Apply the same automatic rounding rule when generating persisted schedules.
- For simple amortization schedules, store rounded regular installments and an exact closing installment.
- Persist totals, balances, and schedule rows from the balanced schedule.
- Do not silently round explicitly supplied manual installment amounts if manual installment persistence is added or already supported by the relevant path.

The current frontend and backend use partially different amortization models. Implementation must preserve existing product behavior while adding rounding to the persisted schedule path that corresponds to automatic simple installments. Frontend-only indefinite preview behavior should remain coherent in the preview; backend support for creating indefinite loans is a separate contract change unless an existing product path already represents it unambiguously.

## Error Handling

- Avoid negative principal allocation when rounding produces an installment that is too low to cover periodic interest.
- Fall back to a valid minimum installment or surface a validation message rather than generating an invalid schedule.
- Preserve exact balance closure for finite schedules.

## Testing

Add focused tests for:

- Rounding examples: `210 -> 200`, `290 -> 300`, and `250 -> 300`.
- Simple schedule: regular installments are rounded and the last installment closes the balance exactly.
- Simple schedule: total row equals the sum of schedule rows.
- Indefinite preview: periodic installment and interest use the same rounded amount while principal remains unchanged.
- Manual installment: explicitly entered values remain unchanged.
- Invalid low rounded installment: schedule does not create negative principal allocations.

Run existing backend tests and the relevant frontend type and lint checks after implementation.
