import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./client-detail-page.tsx', import.meta.url), 'utf8');
const modalSource = readFileSync(
  new URL('../loans/collection-management-panel.tsx', import.meta.url),
  'utf8',
);

test('contacts the client directly without selecting a loan', () => {
  assert.match(source, /Contactar cliente/);
  assert.doesNotMatch(source, /Seleccionar préstamo/);
  assert.match(source, /clientId=\{clientData\.id\}/);
  assert.match(source, /phone=\{clientData\.phone\}/);
  assert.match(modalSource, /href=\{`tel:\$\{phone\}`\}/);
  assert.match(modalSource, /clientId,/);
});
