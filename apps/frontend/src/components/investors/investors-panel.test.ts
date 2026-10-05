import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./investors-panel.tsx', import.meta.url), 'utf8');

test('investor account cards use accessible links and allow the complete grid to scroll', () => {
  assert.match(source, /href={`\/inversionistas\/\$\{investor.id\}`}/);
  assert.match(source, /Ver estado de cuenta/);
  assert.doesNotMatch(source, /md:overflow-hidden/);
  assert.doesNotMatch(source, /router.push/);
});
