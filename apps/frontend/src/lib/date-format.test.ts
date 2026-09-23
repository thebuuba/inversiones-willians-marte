import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeDate, formatShortDate } from './date-format';

test('formats a date-only ISO value without shifting the calendar day', () => {
  assert.equal(formatShortDate('2026-09-25'), '25 sep, 2026');
});

test('shows recent times and yesterday consistently', () => {
  const now = new Date('2026-09-25T12:00:00.000Z');
  assert.equal(formatRelativeDate('2026-09-25T11:55:00.000Z', now), 'Hace 5 min');
  assert.equal(formatRelativeDate('2026-09-24T11:00:00.000Z', now), 'Ayer');
});
