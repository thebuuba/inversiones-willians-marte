import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./movement-modal.tsx', import.meta.url), 'utf8');

test('keeps manual cash movements free of client search and category controls', () => {
  assert.doesNotMatch(source, /Buscar cliente/);
  assert.doesNotMatch(source, /Categoría/);
  assert.match(source, /Persona o concepto/);
});
