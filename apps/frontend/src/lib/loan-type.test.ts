import assert from 'node:assert/strict';
import test from 'node:test';
import { getLoanTypeLabel } from './loan-type';

test('uses the three current loan type labels', () => {
  assert.equal(getLoanTypeLabel('INDEFINITE', 10), 'Indefinido');
  assert.equal(getLoanTypeLabel('REDUCING', 0), 'Sin intereses');
  assert.equal(getLoanTypeLabel('FIXED', 10), 'Tasa fija');
  assert.equal(getLoanTypeLabel('REDUCING', 10), 'Tasa fija');
});
