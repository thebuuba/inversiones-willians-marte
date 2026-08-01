import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./movement-modal.tsx', import.meta.url), 'utf8');

test('keeps manual cash movements free of client search and category controls', () => {
  assert.doesNotMatch(source, /Buscar cliente/);
  assert.doesNotMatch(source, /Categoría/);
  assert.match(source, /Persona o concepto/);
  assert.match(source, /Dinero externo al negocio/);
  assert.match(source, /no suma ni resta en el cuadre de Caja/);
});

test('requires an explicit movement direction and formats numeric amounts', () => {
  assert.match(source, /type: ''/);
  assert.match(source, /Selecciona si el movimiento es una entrada o una salida/);
  assert.match(source, /formatCurrencyInput\(event\.target\.value\)/);
  assert.match(source, /inputMode="decimal"/);
});
