import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./investors-panel.tsx', import.meta.url), 'utf8');

test('uses responsive pagination and leaves phone content scrollable', () => {
  assert.match(source, /const \[pageSize, setPageSize\] = useState\(5\)/);
  assert.match(source, /calculateClientPageSize\(entry\.contentRect\.height, window\.innerWidth\)/);
  assert.match(source, /page \* pageSize, \(page \+ 1\) \* pageSize/);
  assert.match(source, /md:overflow-hidden/);
  assert.doesNotMatch(source, /const PAGE_SIZE = 8/);
});
