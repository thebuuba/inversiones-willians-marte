import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPaymentAllocationPreview,
  getNextScheduledAmount,
  getOutstandingScheduledAmount,
} from './loan-payment.helpers.ts';

const schedule = [
  {
    id: 's1',
    dueDate: '2026-07-15',
    amount: 1000,
    interestPart: 300,
    paidAmount: 100,
    status: 'PARTIAL',
  },
  {
    id: 's2',
    dueDate: '2026-08-15',
    amount: 1000,
    interestPart: 250,
    paidAmount: null,
    status: 'PENDING',
  },
];

test('derives the next and total outstanding scheduled amounts', () => {
  assert.equal(getNextScheduledAmount(schedule), 900);
  assert.equal(getOutstandingScheduledAmount(schedule), 1900);
});

test('previews the same interest-first allocation used by the backend', () => {
  const preview = buildPaymentAllocationPreview(
    schedule,
    [{ allocations: [{ scheduleId: 's1', amount: 100, type: 'INTEREST' }] }],
    1200,
  );

  assert.deepEqual(preview, [
    {
      scheduleId: 's1',
      dueDate: '2026-07-15',
      applied: 900,
      interest: 200,
      principal: 700,
    },
    {
      scheduleId: 's2',
      dueDate: '2026-08-15',
      applied: 300,
      interest: 250,
      principal: 50,
    },
  ]);
});
