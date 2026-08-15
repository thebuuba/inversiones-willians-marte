import assert from 'node:assert/strict';
import test from 'node:test';
import { investmentPaymentStatusVisuals } from './investment-payment-status';
import { loanStatusVisuals } from './loan-status-visuals';

test('uses the matching loan visuals for every investment payment state', () => {
  assert.equal(investmentPaymentStatusVisuals.SCHEDULED.label, 'A tiempo');
  assert.equal(investmentPaymentStatusVisuals.PAID.label, 'A tiempo');
  assert.equal(investmentPaymentStatusVisuals.UPCOMING.label, 'Próximo');
  assert.equal(
    investmentPaymentStatusVisuals.SCHEDULED.className,
    loanStatusVisuals.CURRENT.badgeClassName,
  );
  assert.equal(
    investmentPaymentStatusVisuals.UPCOMING.className,
    loanStatusVisuals.PAID.badgeClassName,
  );
  assert.equal(
    investmentPaymentStatusVisuals.PENDING.className,
    loanStatusVisuals.PENDING.badgeClassName,
  );
  assert.equal(
    investmentPaymentStatusVisuals.OVERDUE.className,
    loanStatusVisuals.LATE.badgeClassName,
  );
  assert.equal(
    investmentPaymentStatusVisuals.PAID.className,
    loanStatusVisuals.CURRENT.badgeClassName,
  );
});
