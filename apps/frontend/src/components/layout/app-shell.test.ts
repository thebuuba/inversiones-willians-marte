import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./app-shell.tsx', import.meta.url), 'utf8');

test('keeps both mobile capture flows public without requiring login', () => {
  assert.match(source, /['"]\/captura-documento\/['"]/);
  assert.match(source, /['"]\/captura-foto-cliente\/['"]/);
});

test('renders the system-wide search inside the desktop topbar', () => {
  assert.match(source, /fixed right-0 top-0/);
  assert.match(source, /<GlobalSearch \/>/);
});

test('labels every supported global-search role', () => {
  const searchSource = readFileSync(new URL('./global-search.tsx', import.meta.url), 'utf8');
  assert.match(searchSource, /CLIENT: 'Cliente'/);
  assert.match(searchSource, /LOAN: 'Préstamo'/);
  assert.match(searchSource, /INVESTOR: 'Inversionista'/);
  assert.match(searchSource, /BORROWER: 'Prestatario'/);
});
