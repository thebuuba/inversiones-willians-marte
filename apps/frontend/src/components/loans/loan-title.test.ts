import assert from 'node:assert/strict';
import test from 'node:test';
import { getLoanTitle } from './loan-title.ts';

test('uses the loan number when the loan is not in a portfolio', () => {
  assert.equal(getLoanTitle({ loanNumber: 1, portfolio: null }), 'Préstamo #1');
});

test('uses the portfolio name when the loan is in a portfolio', () => {
  assert.equal(getLoanTitle({ loanNumber: 7, portfolio: { name: 'Comercial' } }), 'Comercial');
});
