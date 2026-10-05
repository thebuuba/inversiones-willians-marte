import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from '../api';
import { getTasks } from './tasks';

test('loads events beyond the first task page so every calendar date has its events', async () => {
  const previousAdapter = api.defaults.adapter;
  api.defaults.adapter = async (config) => ({
    data: {
      success: true,
      data:
        Number(config.params?.skip ?? 0) === 0
          ? Array.from({ length: 100 }, (_, index) => ({ id: `event-${index}` }))
          : [{ id: 'last-event' }],
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
  try {
    const events = await getTasks();
    assert.equal(events.length, 101);
    assert.equal(events[100].id, 'last-event');
  } finally {
    api.defaults.adapter = previousAdapter;
  }
});
