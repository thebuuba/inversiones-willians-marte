import assert from 'node:assert/strict';
import test from 'node:test';
import { getStaggerDelay } from './animation.ts';

test('caps stagger delays so long lists finish entering promptly', () => {
  assert.equal(getStaggerDelay(0, 0.05), 0);
  assert.equal(getStaggerDelay(3, 0.05), 0.15);
  assert.equal(getStaggerDelay(50, 0.05), 0.3);
});
