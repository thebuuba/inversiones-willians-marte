import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearClientCache,
  fetchClientCache,
  invalidateClientCache,
  invalidateClientCachePrefix,
  readClientCache,
  writeClientCache,
} from './client-cache.ts';

test('returns expired cached data as stale while it is revalidated', () => {
  clearClientCache();
  writeClientCache('clients', ['cached client'], 1_000, 10_000);

  assert.deepEqual(readClientCache('clients', 11_001), {
    data: ['cached client'],
    stale: true,
  });
});

test('returns cached data as fresh before its ttl expires', () => {
  clearClientCache();
  writeClientCache('clients', ['cached client'], 1_000, 10_000);

  assert.deepEqual(readClientCache('clients', 10_999), {
    data: ['cached client'],
    stale: false,
  });
});

test('deduplicates in-flight requests for the same key', async () => {
  clearClientCache();
  let calls = 0;

  const [first, second] = await Promise.all([
    fetchClientCache('loans', async () => {
      calls += 1;
      return ['fresh loan'];
    }, 1_000),
    fetchClientCache('loans', async () => {
      calls += 1;
      return ['duplicate loan'];
    }, 1_000),
  ]);

  assert.equal(calls, 1);
  assert.deepEqual(first, ['fresh loan']);
  assert.deepEqual(second, ['fresh loan']);
});

test('does not write an invalidated in-flight result back into cache', async () => {
  clearClientCache();
  let resolveRequest: (value: string[]) => void = () => undefined;
  const request = fetchClientCache(
    'loans',
    () => new Promise<string[]>((resolve) => {
      resolveRequest = resolve;
    }),
    1_000,
  );

  await Promise.resolve();
  invalidateClientCache('loans');
  resolveRequest(['stale loan']);
  assert.deepEqual(await request, ['stale loan']);
  assert.equal(readClientCache('loans'), null);
});

test('invalidates all cache variants with a prefix', () => {
  clearClientCache();
  writeClientCache('clients::0', ['page 1'], 1_000);
  writeClientCache('clients:ana:0', ['search'], 1_000);
  writeClientCache('loans::0', ['loan'], 1_000);

  invalidateClientCachePrefix('clients:');

  assert.equal(readClientCache('clients::0'), null);
  assert.equal(readClientCache('clients:ana:0'), null);
  assert.deepEqual(readClientCache('loans::0')?.data, ['loan']);
});
