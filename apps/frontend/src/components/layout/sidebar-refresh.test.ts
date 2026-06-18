import assert from 'node:assert/strict';
import test from 'node:test';
import { canRefreshSidebarCounters, SIDEBAR_COUNTER_REFRESH_MS } from './sidebar-refresh.ts';

test('refreshes sidebar counters at most once per minute', () => {
  assert.equal(SIDEBAR_COUNTER_REFRESH_MS, 60_000);
});

test('skips sidebar counter refreshes while the app is hidden', () => {
  assert.equal(canRefreshSidebarCounters('hidden'), false);
  assert.equal(canRefreshSidebarCounters('visible'), true);
});
