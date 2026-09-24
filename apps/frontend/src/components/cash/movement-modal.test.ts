import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./movement-modal.tsx', import.meta.url), 'utf8');

test('manual movements default to an income with a category', () => {
  assert.match(source, /type: 'in'/);
  assert.match(source, /category: 'Otro'/);
  assert.match(source, /updateValue\('category'/);
});

test('amount controls accept numeric input and preset increments', () => {
  assert.match(source, /formatCurrencyInput\(event\.target\.value\)/);
  assert.match(source, /\[500, 1000, 2000, 5000\]/);
  assert.match(source, /inputMode="decimal"/);
});
