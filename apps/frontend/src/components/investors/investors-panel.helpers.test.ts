import assert from 'node:assert/strict';
import test from 'node:test';
import { formatInvestorCurrency } from './investors-panel.helpers.ts';

test('formats investor capital with comma thousands separators', () => {
  assert.equal(formatInvestorCurrency(3300000), 'RD$3,300,000');
  assert.equal(formatInvestorCurrency('3300000'), 'RD$3,300,000');
});
