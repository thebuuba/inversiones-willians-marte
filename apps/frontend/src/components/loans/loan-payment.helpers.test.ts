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

test('does not show interest-inclusive loan balance as pending capital', () => {
  const summary = getLoanPaymentSummary(schedule, [], [], 200000, '2026-09-23');
  assert.equal(summary.capitalPaid, 0);
  assert.equal(summary.capitalOutstanding, 200000);
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
      penalty: 0,
    },
    {
      scheduleId: 's2',
      dueDate: '2026-08-15',
      applied: 300,
      interest: 250,
      principal: 50,
      penalty: 0,
    },
  ]);
});

test('previews mora after each installment and includes it in the applied total', () => {
  assert.deepEqual(
    buildPaymentAllocationPreview(schedule, [], 1050, [
      { scheduleId: 's1', amount: 75, paidAmount: 25, paid: false },
    ]),
    [
      {
        scheduleId: 's1',
        dueDate: '2026-07-15',
        applied: 950,
        interest: 300,
        principal: 600,
        penalty: 50,
      },
      {
        scheduleId: 's2',
        dueDate: '2026-08-15',
        applied: 100,
        interest: 100,
        principal: 0,
        penalty: 0,
      },
    ],
  );
});

test('previews a fee even when its installment has already been fully covered', () => {
  const feeOnly = [{ ...schedule[0], paidAmount: 1000, status: 'PARTIAL' }];
  assert.deepEqual(
    buildPaymentAllocationPreview(feeOnly, [], 25, [{ scheduleId: 's1', amount: 25, paid: false }]),
    [
      {
        scheduleId: 's1',
        dueDate: '2026-07-15',
        applied: 25,
        interest: 0,
        principal: 0,
        penalty: 25,
      },
    ],
  );
});

test('does not include cancelled installments in a collection preview', () => {
  assert.deepEqual(
    buildPaymentAllocationPreview([{ ...schedule[0], status: 'CANCELLED' }], [], 500),
    [],
  );
});

test('does not offer cancelled installments or their fees as collectible', () => {
  const cancelled = [{ ...schedule[0], status: 'CANCELLED' }];
  const fees = [{ scheduleId: 's1', amount: 50, paid: false }];
  assert.equal(getOutstandingScheduledAmount(cancelled, fees), 0);
  assert.equal(getAmountToBringCurrent(cancelled, '2026-07-16', fees), 0);
});
