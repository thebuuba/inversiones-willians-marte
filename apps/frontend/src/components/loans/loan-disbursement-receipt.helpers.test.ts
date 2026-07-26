import assert from 'node:assert/strict';
import test from 'node:test';
import { amountToSpanishWords, receiptCopyLabel } from './loan-disbursement-receipt.helpers';

test('formats Dominican peso amounts in Spanish', () => {
  assert.equal(amountToSpanishWords(1), 'un peso con 00/100');
  assert.equal(amountToSpanishWords(21.5), 'veintiún pesos con 50/100');
  assert.equal(amountToSpanishWords(50_000), 'cincuenta mil pesos con 00/100');
  assert.equal(amountToSpanishWords(1_250_001.09), 'un millón doscientos cincuenta mil un pesos con 09/100');
});

test('labels original and client copy explicitly', () => {
  assert.equal(receiptCopyLabel('company'), 'ORIGINAL - EMPRESA');
  assert.equal(receiptCopyLabel('client'), 'COPIA - CLIENTE');
});
