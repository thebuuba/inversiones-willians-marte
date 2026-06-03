import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCalendarWeeks, getNextMonthIsoDate } from './date-picker.helpers.ts';

test('builds a sunday-first calendar grid with adjacent month days', () => {
  const weeks = buildCalendarWeeks(2026, 5, '2026-06-25');

  assert.equal(weeks.length, 6);
  assert.deepEqual(
    weeks[0].map((day) => day.iso),
    ['2026-05-31', '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06'],
  );
  assert.deepEqual(
    weeks[5].map((day) => day.iso),
    ['2026-07-05', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11'],
  );
  assert.equal(weeks.flat().find((day) => day.iso === '2026-06-25')?.selected, true);
});

test('returns the same day in the next month as an iso date', () => {
  assert.equal(getNextMonthIsoDate(new Date(2026, 5, 3)), '2026-07-03');
});
