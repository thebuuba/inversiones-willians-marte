import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./app-shell.tsx', import.meta.url), 'utf8');

test('keeps both mobile capture flows public without requiring login', () => {
  assert.match(source, /['"]\/captura-documento\/['"]/);
  assert.match(source, /['"]\/captura-foto-cliente\/['"]/);
});
