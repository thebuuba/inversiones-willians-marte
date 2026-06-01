import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canCalculateLoan,
  computeSchedule,
  normalizeLoanTerm,
  parseStrictNumber,
} from './new-loan-form.helpers.ts';

const validLoan = {
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
  assert.equal(canCalculateLoan({ ...validLoan, term: '1', termUnit: 'weeks' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, amortizationType: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, paymentFrequency: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, firstPaymentDate: '' }), false);
  assert.equal(canCalculateLoan({ ...validLoan, firstPaymentDate: 'fecha-invalida' }), false);
});

test('normalizes the visible loan term with the submit conversion', () => {
  assert.equal(normalizeLoanTerm('1', 'weeks'), 0);
  assert.equal(normalizeLoanTerm('4', 'weeks'), 1);
  assert.equal(normalizeLoanTerm('2.17', 'fortnights'), 1);
  assert.equal(normalizeLoanTerm('12', 'months'), 12);
});

test('rejects exponent notation in visible numeric inputs', () => {
  assert.equal(parseStrictNumber('1e2'), null);
});

test('generates one schedule row for every installment in the term', () => {
  const result = computeSchedule(25000, 12, 12);

  assert.equal(result.schedule.length, 12);
});

test('does not generate schedule rows for a term normalized to zero', () => {
  const result = computeSchedule(25000, 12, normalizeLoanTerm('1', 'weeks'));

  assert.equal(result.schedule.length, 0);
});
