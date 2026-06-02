import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampProgress,
  getLoanDetailTotals,
  getLoanProgress,
  getRegularInstallment,
  getScheduleRemaining,
} from './loan-detail.helpers.ts';

test('clamps progress between zero and one hundred', () => {
  assert.equal(clampProgress(-12), 0);
  assert.equal(clampProgress(42.4), 42);
  assert.equal(clampProgress(130), 100);
});

test('derives loan progress without allowing negative or overflow values', () => {
  assert.equal(getLoanProgress(100_000, 43_500), 57);
  assert.equal(getLoanProgress(100_000, 104_546), 0);
  assert.equal(getLoanProgress(0, 0), 0);
});

test('returns zero installment when term is empty', () => {
  assert.equal(getRegularInstallment(104_546, 0), 0);
  assert.equal(getRegularInstallment(104_546, 5), 20_909);
});

test('never returns a negative schedule remainder', () => {
  assert.equal(getScheduleRemaining(10_000, 3_000), 7_000);
  assert.equal(getScheduleRemaining(10_000, 12_000), 0);
});

test('derives detail totals from payments and schedule rows', () => {
  assert.deepEqual(
    getLoanDetailTotals({
      principal: 100_000,
      balance: 43_500,
      totalAmount: 120_000,
      term: 12,
      payments: [{ amount: 20_000 }, { amount: 6_500 }],
      schedule: [
        { status: 'PAID' },
        { status: 'PAID' },
        { status: 'PARTIAL' },
      ],
    }),
    {
      principal: 100_000,
      balance: 43_500,
      totalPaid: 26_500,
      installment: 10_000,
      progress: 64,
      paidInstallments: 2,
      totalInstallments: 3,
    },
  );
});
