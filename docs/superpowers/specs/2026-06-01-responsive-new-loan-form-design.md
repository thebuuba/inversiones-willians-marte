# Responsive New Loan Form Design

## Goal

Improve the `/prestamos/nuevo` screen so it fits correctly at 100% browser zoom, uses the available vertical space efficiently, groups the main loan inputs coherently, and displays the complete installment schedule after a valid calculation.

## Scope

This change is limited to the frontend new-loan screen. It does not change the backend loan creation contract, amortization formulas, or persisted loan fields.

## Layout

- Remove the mock eyebrow text `Nuevo préstamo`.
- Reduce the `Crear préstamo` heading to a normal page-title size.
- Move the form upward by reclaiming the removed header space.
- Keep the screen responsive at 100% browser zoom. Inputs must wrap into fewer columns as the viewport narrows instead of overflowing or requiring manual zoom changes.
- Keep the existing visual language and avoid an unrelated redesign.

## Main Information Card

The `Información principal` card will contain:

- Monto
- Interés
- Plazo and unit
- Propósito
- Amortización
- Frecuencia
- Primera cuota

`Amortización` and `Frecuencia` will use select lists instead of square option buttons. The separate payment-configuration card will be removed so the primary inputs remain together.

## Calculation Behavior

- `Calcular préstamo` remains visible.
- The button is disabled until the required values in the main information card are present and valid.
- Required values are: amount greater than zero, interest rate not negative, term greater than zero, amortization type, payment frequency, and first payment date.
- Clicking the button after valid input reveals the schedule.

## Installment Schedule

- Render every calculated installment, not an abbreviated subset.
- Let the table grow naturally when there are few installments.
- Apply an internal vertical scroll only after the table exceeds an approximate maximum height of `400px`.
- Keep the surrounding card size stable after the threshold is reached.

## Testing

- Extract small calculation-state helpers where needed so button enablement and complete row generation can be covered with focused unit tests.
- Run the frontend linter and build after the change.
- Verify the screen manually at `http://localhost:3001/prestamos/nuevo`.

