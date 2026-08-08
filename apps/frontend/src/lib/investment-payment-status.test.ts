import assert from 'node:assert/strict';
import test from 'node:test';
import { investmentPaymentStatusVisuals } from './investment-payment-status';

test('uses distinct semantic visuals for every investment payment state', () => {
  assert.equal(investmentPaymentStatusVisuals.SCHEDULED.label, 'Programado');
  assert.equal(investmentPaymentStatusVisuals.UPCOMING.label, 'Próximo');
  assert.match(investmentPaymentStatusVisuals.UPCOMING.className, /state-info/);
  assert.match(investmentPaymentStatusVisuals.PENDING.className, /state-warning/);
  assert.match(investmentPaymentStatusVisuals.OVERDUE.className, /state-danger/);
});
