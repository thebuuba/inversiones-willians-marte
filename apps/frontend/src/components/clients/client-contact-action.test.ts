import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./client-detail-page.tsx', import.meta.url), 'utf8');

test('keeps the client contact action visible without an active loan', () => {
  assert.match(source, /Contactar cliente/);
  assert.doesNotMatch(
    source,
    /\{firstActiveLoan && \(\s*<DropdownMenu\.Item[\s\S]{0,1200}Contactar cliente/,
  );
  assert.match(source, /if \(!firstActiveLoan\)/);
  assert.match(source, /No hay un préstamo activo para asociar esta gestión\./);
});
