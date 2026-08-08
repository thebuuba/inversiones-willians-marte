import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const middlewareUrl = new URL('./middleware.ts', import.meta.url);
const proxyUrl = new URL('./proxy.ts', import.meta.url);
const source = readFileSync(middlewareUrl, 'utf8');

test('keeps request interception on the Edge-compatible middleware convention', () => {
  assert.equal(existsSync(proxyUrl), false);
  assert.match(source, /export function middleware\(/);
  assert.doesNotMatch(source, /\bBuffer\b/);
});
