import assert from 'node:assert/strict';
import test from 'node:test';
import { formatInvestorCurrency, getInvestorOverview } from './investors-panel.helpers.ts';

test('formats investor capital with comma thousands separators', () => {
  assert.equal(formatInvestorCurrency(3300000), 'RD$3,300,000');
  assert.equal(formatInvestorCurrency('3300000'), 'RD$3,300,000');
});

test('weights the return by capital and distinguishes unavailable gains from zero', () => {
  const overview = getInvestorOverview([
    { capital: 100000, monthlyPayment: 4000, yearGainsPaid: 12000 },
    { capital: 300000, monthlyPayment: 6000, yearGainsPaid: 18000 },
  ]);
  assert.deepEqual(overview, { capital: 400000, rate: 2.5, yearGains: 30000 });
  assert.equal(getInvestorOverview([{ capital: 0, monthlyPayment: 0 }]).yearGains, null);
  assert.deepEqual(getInvestorOverview([]), { capital: 0, rate: 0, yearGains: 0 });
});
