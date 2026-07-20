import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPaymentAllocationPreview,
  getAmountToBringCurrent,
  getLoanPaymentSummary,
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

test('prefills only the amount already due to bring the loan current', () => {
  assert.equal(getAmountToBringCurrent(schedule, '2026-07-16'), 900);
  assert.equal(getAmountToBringCurrent(schedule, '2026-07-14'), 0);
});

test('summarizes the financial data shown while collecting a loan', () => {
  assert.deepEqual(
    getLoanPaymentSummary(
      schedule,
      [
        {
          amount: 400,
          allocations: [
            { scheduleId: 's1', amount: 100, type: 'INTEREST' },
            { scheduleId: 's1', amount: 300, type: 'PRINCIPAL' },
          ],
        },
      ],
      [{ amount: 75, paid: false }],
      2000,
      1700,
      '2026-07-16',
    ),
    {
      capitalPaid: 300,
      capitalOutstanding: 1700,
      interestPaid: 100,
      interestOutstanding: 450,
      feesOutstanding: 75,
      totalPaid: 400,
      overdueAmount: 900,
      overdueInstallments: 1,
      paidInstallments: 0,
    },
  );
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
