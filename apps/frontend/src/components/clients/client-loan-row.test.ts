import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./client-detail-page.tsx', import.meta.url), 'utf8');

test('opens a client loan row with one click or Enter without hijacking row actions', () => {
  assert.match(source, /onClick=\{\(event\) => \{/);
  assert.match(source, /closest\('a, button, \[role="menuitem"\]'\)/);
  assert.match(source, /event\.key !== 'Enter'/);
  assert.doesNotMatch(source, /onDoubleClick=/);
});
