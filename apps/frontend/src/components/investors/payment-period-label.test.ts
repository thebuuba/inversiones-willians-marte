import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPaymentPeriods } from './payment-period-label.ts';

test('labels every month covered by an accumulated payment on its receipt', () => {
  assert.equal(
    formatPaymentPeriods({
      periodMonth: 2,
      periodYear: 2026,
      allocations: [
        { periodMonth: 2, periodYear: 2026, amount: 15000 },
        { periodMonth: 3, periodYear: 2026, amount: 5000 },
      ],
    }),
    'Febrero 2026, Marzo 2026',
  );
});
test('keeps the original period for historical receipts without allocations', () => {
  assert.equal(formatPaymentPeriods({ periodMonth: 12, periodYear: 2025 }), 'Diciembre 2025');
});
