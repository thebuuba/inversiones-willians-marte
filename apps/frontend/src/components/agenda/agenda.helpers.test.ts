import assert from 'node:assert/strict';
import test from 'node:test';
import type { TaskItem } from '@inversiones/shared';
import {
  buildAgendaMonth,
  getAgendaDayEvents,
  getAgendaDate,
  getAgendaEventType,
} from './agenda.helpers';

test('places Sunday month starts in the last column and includes leap day', () => {
  const march = buildAgendaMonth('2026-03-01');
  assert.deepEqual(march.slice(0, 7), [null, null, null, null, null, null, '2026-03-01']);
  assert.equal(march.filter(Boolean).length, 31);
  assert.ok(buildAgendaMonth('2024-02-01').includes('2024-02-29'));
});

test('groups events by office date and orders timed events before untimed ones', () => {
  const events = [
    { id: 'late', dueDate: '2026-10-05T16:00:00Z', time: '15:00' },
    { id: 'untimed', dueDate: '2026-10-05T16:00:00Z', time: null },
    { id: 'early', dueDate: '2026-10-06T02:00:00Z', time: '09:00' },
    { id: 'tomorrow', dueDate: '2026-10-06T16:00:00Z', time: '08:00' },
    { id: 'undated', dueDate: null },
  ] as TaskItem[];
  assert.equal(getAgendaDate('2026-10-06T02:00:00Z'), '2026-10-05');
  assert.deepEqual(
    getAgendaDayEvents(events, '2026-10-05').map((event) => event.id),
    ['early', 'late', 'untimed'],
  );
  assert.equal(events[0].id, 'late');
});

test('keeps legacy task categories visible in the simpler event calendar', () => {
  assert.equal(getAgendaEventType('cliente'), 'llamada');
  assert.equal(getAgendaEventType('cobro'), 'cobro');
  assert.equal(getAgendaEventType('visita'), 'visita');
  assert.equal(getAgendaEventType('oficina'), 'reunion');
});
