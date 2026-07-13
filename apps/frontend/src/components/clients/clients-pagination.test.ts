import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateClientPageSize } from './clients-pagination';

test('uses all seven 64px row slots available in the client table body', () => {
  assert.equal(calculateClientPageSize(7 * 64), 7);
});

test('does not add a row when the last 64px slot is incomplete', () => {
  assert.equal(calculateClientPageSize(7 * 64 - 1), 6);
});
