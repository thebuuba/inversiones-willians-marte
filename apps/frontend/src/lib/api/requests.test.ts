import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from '../api.ts';
import { getRequests } from './requests.ts';

test('loads requests beyond the first 100 records', async () => {
  const originalGet = api.get;
  const calls: number[] = [];
  api.get = (async (_url: string, config?: { params?: { skip: number } }) => {
    const skip = config?.params?.skip ?? 0;
    calls.push(skip);
    const page = Array.from({ length: skip === 0 ? 100 : 1 }, (_, index) => ({
      id: String(skip + index),
    }));
    return { data: { data: page } };
  }) as typeof api.get;

  try {
    const requests = await getRequests();
    assert.equal(requests.length, 101);
    assert.deepEqual(calls, [0, 100]);
  } finally {
    api.get = originalGet;
  }
});
