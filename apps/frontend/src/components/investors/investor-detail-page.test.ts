import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./investor-detail-page.tsx', import.meta.url), 'utf8');

test('distributes investment columns and anchors capital to the right edge', () => {
  assert.match(source, /const investmentTableColumns = 'grid-cols-6'/);
  assert.match(source, /<span className="text-right">Capital<\/span>/);
  assert.match(source, /text-right font-semibold tabular-nums text-text-primary/);
  assert.match(source, /className="overflow-x-auto"/);
  assert.match(source, /min-w-\[930px\]/);
});

test('uses an actions menu instead of a direct register-payment button', () => {
  assert.match(source, /<DropdownMenu\.Trigger asChild>/);
  assert.match(source, />\s*Acciones\s*<ChevronDown/);
  assert.match(source, /<DropdownMenu\.Item asChild>/);
  assert.match(source, /href={`\/inversionistas\/pago\?investmentId=\$\{investments\[0\]\.id\}`}/);
});
