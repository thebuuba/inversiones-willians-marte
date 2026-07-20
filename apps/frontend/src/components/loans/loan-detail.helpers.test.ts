import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampProgress,
  getLoanCollectionStatus,
  getScheduleDisplayStatus,
  getClientLoanStats,
  getLoanDetailTotals,
  getLoanOperationalSummary,
  getLoanProgress,
  getRegularInstallment,
  getNextInstallmentAmount,
  getScheduleRemaining,
} from './loan-detail.helpers.ts';

const today = new Date('2026-06-15T12:00:00');
const finiteLoan = {
  balance: 10_000,
  interestType: 'FLAT',
  endDate: '2026-12-15T00:00:00',
};

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

test('uses the next unpaid scheduled amount instead of averaging the loan total', () => {
  const schedule = [
    { status: 'PENDING', amount: 10_000 },
    { status: 'PENDING', amount: 10_655.79 },
  ];

  assert.equal(getNextInstallmentAmount(schedule, 120_655.79, 12), 10_000);
  assert.equal(getNextInstallmentAmount([], 120_655.79, 12), 10_055);
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
      schedule: [{ status: 'PAID' }, { status: 'PAID' }, { status: 'PARTIAL' }],
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

test('derives operational summary from schedules, payments, and existing late fees', () => {
  assert.deepEqual(
    getLoanOperationalSummary(
      {
        schedule: [
          { dueDate: '2026-06-10T00:00:00', amount: 1000, paidAmount: 1000, status: 'PAID' },
          { dueDate: '2026-06-15T00:00:00', amount: 1000, paidAmount: 250, status: 'PARTIAL' },
          { dueDate: '2026-06-20T00:00:00', amount: 1000, paidAmount: null, status: 'PENDING' },
        ],
        payments: [
          { amount: 500, paymentDate: '2026-06-12T00:00:00', receivedBy: { name: 'Ana' } },
          { amount: 750, paymentDate: '2026-06-16T00:00:00', receivedBy: { name: 'Luis' } },
        ],
        lateFees: [
          { amount: 150, paid: false },
          { amount: 50, paid: true },
        ],
      },
      today,
    ),
    {
      pendingInstallments: 2,
      overdueInstallments: 1,
      unpaidLateFees: 150,
      nextSchedule: {
        dueDate: '2026-06-15T00:00:00',
        amount: 1000,
        paidAmount: 250,
        status: 'PARTIAL',
      },
      nextSchedulePending: 750,
      lastPayment: {
        amount: 750,
        paymentDate: '2026-06-16T00:00:00',
        receivedBy: { name: 'Luis' },
      },
    },
  );
});

test('keeps a loan on time before the next unpaid installment arrives', () => {
  assert.equal(
    getLoanCollectionStatus(
      { ...finiteLoan, schedule: [{ dueDate: '2026-06-16T00:00:00', status: 'PENDING' }] },
      today,
    ),
    'A tiempo',
  );
});

test('shows future schedule rows as on time instead of pending', () => {
  assert.equal(getScheduleDisplayStatus('PENDING', '2026-07-15T00:00:00', today), 'A tiempo');
  assert.equal(getScheduleDisplayStatus('PENDING', '2026-06-15T00:00:00', today), 'Pendiente');
  assert.equal(getScheduleDisplayStatus('PENDING', '2026-06-09T00:00:00', today), 'Atrasado');
  assert.equal(getScheduleDisplayStatus('PAID', '2026-07-15T00:00:00', today), 'Pagado');
});

test('marks a loan pending on its due date and through its five-day grace period', () => {
  assert.equal(
    getLoanCollectionStatus(
      { ...finiteLoan, schedule: [{ dueDate: '2026-06-15T00:00:00', status: 'PENDING' }] },
      today,
    ),
    'Pendiente',
  );
  assert.equal(
    getLoanCollectionStatus(
      { ...finiteLoan, schedule: [{ dueDate: '2026-06-10T00:00:00', status: 'PENDING' }] },
      today,
    ),
    'Pendiente',
  );
});

test('marks a loan overdue after its five-day grace period', () => {
  assert.equal(
    getLoanCollectionStatus(
      { ...finiteLoan, schedule: [{ dueDate: '2026-06-09T00:00:00', status: 'PENDING' }] },
      today,
    ),
    'Atrasado',
  );
});

test('marks finite loans expired after the final date while balance remains', () => {
  assert.equal(
    getLoanCollectionStatus({ ...finiteLoan, endDate: '2026-06-14T00:00:00', schedule: [] }, today),
    'Vencido',
  );
});

test('never marks indefinite loans expired', () => {
  assert.equal(
    getLoanCollectionStatus(
      {
        ...finiteLoan,
        interestType: 'INDEFINITE',
        endDate: '2026-06-01T00:00:00',
        schedule: [{ dueDate: '2026-06-01T00:00:00', status: 'PENDING' }],
      },
      today,
    ),
    'Atrasado',
  );
});

test('ignores paid schedule rows when calculating collection status', () => {
  assert.equal(
    getLoanCollectionStatus(
      {
        ...finiteLoan,
        schedule: [
          { dueDate: '2026-06-01T00:00:00', status: 'PAID' },
          { dueDate: '2026-06-20T00:00:00', status: 'PENDING' },
        ],
      },
      today,
    ),
    'A tiempo',
  );
});

test('summarizes serialized loan decimals without concatenating values', () => {
  assert.deepEqual(
    getClientLoanStats([
      { principal: '100000', balance: '104546.02', schedule: [{ paidAmount: null }] },
      { principal: '25000', balance: '25000', schedule: [{ paidAmount: '300' }] },
      { principal: '30500', balance: '30500', schedule: [{ paidAmount: 200 }] },
    ]),
    {
      totalLoaned: 155_500,
      totalBalance: 160_046.02,
      totalPaid: 500,
    },
  );
});
