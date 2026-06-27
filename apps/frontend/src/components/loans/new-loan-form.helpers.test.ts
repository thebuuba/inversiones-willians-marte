import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type LoanCalculationFields,
  canCalculateLoan,
  computeSchedule,
  getInstallmentIsoDate,
  getPeriodicInterestRate,
  normalizeLoanTerm,
  parseStrictNumber,
  getLoanSummaryTotals,
  shouldShowCalculatedLoanActions,
} from './new-loan-form.helpers.ts';

const validLoan: LoanCalculationFields = {
  amount: '25000',
  interestRate: '12',
  term: '12',
  termUnit: 'months',
  amortizationType: 'SIMPLE',
  paymentFrequency: 'MONTHLY',
  firstPaymentDate: '2026-06-15',
};

test('enables calculation only when every required loan field is valid', () => {
  assert.equal(canCalculateLoan(validLoan), true);

  assert.equal(canCalculateLoan({ ...validLoan, amount: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, amount: '0' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, amount: '1e2' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, interestRate: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, interestRate: '-1' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, interestRate: '1e2' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, term: '0' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, term: '1e2' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, term: '1', termUnit: 'weeks', paymentFrequency: 'WEEKLY' }), true);
  assert.equal(canCalculateLoan({ ...validLoan, amortizationType: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, paymentFrequency: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, firstPaymentDate: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, firstPaymentDate: 'fecha-invalida' }), false);
});

test('normalizes the visible loan term as an installment count', () => {
  assert.equal(normalizeLoanTerm('1', 'weeks'), 1);
  assert.equal(normalizeLoanTerm('4', 'weeks'), 4);
  assert.equal(normalizeLoanTerm('24', 'fortnights'), 24);
  assert.equal(normalizeLoanTerm('12', 'months'), 12);
});

test('rejects exponent notation in visible numeric inputs', () => {
  assert.equal(parseStrictNumber('1e2'), null);
});

test('generates one schedule row for every installment in the term', () => {
  const result = computeSchedule(25000, 12, 12);

  assert.equal(result.schedule.length, 12);
});

test('keeps fortnightly terms as the requested number of installments', () => {
  const result = computeSchedule(25000, 6, normalizeLoanTerm('24', 'fortnights'));

  assert.equal(result.schedule.length, 24);
});

test('converts monthly interest to the selected payment frequency', () => {
  assert.equal(getPeriodicInterestRate(6, 'MONTHLY'), 6);
  assert.equal(getPeriodicInterestRate(6, 'FORTNIGHTLY'), 3);
  assert.equal(getPeriodicInterestRate(6, 'WEEKLY'), 1.5);
});

test('uses lower per-installment interest for fortnightly schedules', () => {
  const monthlySchedule = computeSchedule(25000, getPeriodicInterestRate(6, 'MONTHLY'), 24);
  const fortnightlySchedule = computeSchedule(25000, getPeriodicInterestRate(6, 'FORTNIGHTLY'), 24);

  assert.equal(monthlySchedule.schedule[0].interest, 1500);
  assert.equal(fortnightlySchedule.schedule[0].interest, 750);
  assert.ok(fortnightlySchedule.schedule[0].payment < monthlySchedule.schedule[0].payment);
});

test('does not allow custom payments to create negative principal amortization', () => {
  const result = computeSchedule(1000, 10, 2, 'SIMPLE', '50');

  assert.deepEqual(
    result.schedule.map((row) => row.principal),
    [0, 0],
  );
  assert.deepEqual(
    result.schedule.map((row) => row.balance),
    [1000, 1000],
  );
  assert.equal(result.totalPayment, 100);
  assert.equal(result.totalInterest, 100);
});

test('derives installment dates from first payment date and payment frequency', () => {
  assert.equal(getInstallmentIsoDate('2026-06-08', 1, 'MONTHLY'), '2026-06-08');
  assert.equal(getInstallmentIsoDate('2026-06-08', 2, 'MONTHLY'), '2026-07-08');
  assert.equal(getInstallmentIsoDate('2026-01-31', 2, 'MONTHLY'), '2026-02-28');
  assert.equal(getInstallmentIsoDate('2026-06-08', 2, 'FORTNIGHTLY'), '2026-06-23');
  assert.equal(getInstallmentIsoDate('2026-06-08', 2, 'WEEKLY'), '2026-06-15');
});

test('alternates fortnightly dates by month halves from the first payment day', () => {
  assert.equal(getInstallmentIsoDate('2026-06-30', 1, 'FORTNIGHTLY'), '2026-06-30');
  assert.equal(getInstallmentIsoDate('2026-06-30', 2, 'FORTNIGHTLY'), '2026-07-15');
  assert.equal(getInstallmentIsoDate('2026-06-30', 3, 'FORTNIGHTLY'), '2026-07-30');
  assert.equal(getInstallmentIsoDate('2026-06-30', 4, 'FORTNIGHTLY'), '2026-08-15');
  assert.equal(getInstallmentIsoDate('2026-06-30', 5, 'FORTNIGHTLY'), '2026-08-30');
});

test('does not generate schedule rows for an empty normalized term', () => {
  const result = computeSchedule(25000, 12, normalizeLoanTerm('', 'weeks'));

  assert.equal(result.schedule.length, 0);
});

test('shows calculated loan actions only after calculating the loan', () => {
  assert.equal(shouldShowCalculatedLoanActions(false), false);
  assert.equal(shouldShowCalculatedLoanActions(true), true);
});

test('builds loan summary totals from the amortization totals', () => {
  assert.deepEqual(getLoanSummaryTotals(12000, 400), {
    interest: 400,
    total: 12400,
  });
});
