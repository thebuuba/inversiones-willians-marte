import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCurrencyInput, formatDop, formatSignedDop, parseCurrencyInput } from './currency.ts';

test('formats Dominican pesos with comma thousands separators', () => {
  assert.equal(formatDop(300000), 'RD$300,000');
  assert.equal(formatDop('3300000'), 'RD$3,300,000');
  assert.equal(formatDop(12500.5, { decimals: 2 }), 'RD$12,500.50');
});

test('formats signed Dominican pesos with comma thousands separators', () => {
  assert.equal(formatSignedDop(300000), '+RD$300,000');
  assert.equal(formatSignedDop(300000, { negative: true }), '−RD$300,000');
});

test('parses currency input containing commas and symbols', () => {
  assert.equal(parseCurrencyInput('RD$3,300,000'), 3300000);
});

test('keeps currency inputs numeric and adds thousands separators', () => {
  assert.equal(formatCurrencyInput('abc1234567'), '1,234,567');
  assert.equal(formatCurrencyInput('001250.567'), '1,250.56');
  assert.equal(formatCurrencyInput('1,250.'), '1,250.');
});
