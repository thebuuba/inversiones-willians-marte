import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMonthlyInterest, formatDopCurrency } from './investor-calculation.helpers.ts';

test('calculates monthly interest using the portfolio rate rule', () => {
  assert.equal(calculateMonthlyInterest(3000000, 3), 30000);
});

test('returns null when capital or rate are not positive numbers', () => {
  assert.equal(calculateMonthlyInterest(0, 12), null);
  assert.equal(calculateMonthlyInterest(3000000, 0), null);
  assert.equal(calculateMonthlyInterest(Number.NaN, 12), null);
});

test('formats Dominican peso currency with thousands separators', () => {
  assert.equal(formatDopCurrency(30000), 'RD$30,000.00');
});
