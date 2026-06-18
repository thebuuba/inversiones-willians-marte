import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError, type AxiosAdapter } from 'axios';
import { api } from './api.ts';
import { readClientCache, writeClientCache } from './client-cache.ts';

function installBrowserGlobals(storage = new Map<string, string>()) {
  const location = { href: '' };

  Object.defineProperties(globalThis, {
    window: {
      configurable: true,
      value: { location },
    },
    localStorage: {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
      },
    },
  });

  return { location, storage };
}

test('ignores corrupt stored auth when adding request authorization', async () => {
  const { storage } = installBrowserGlobals(new Map([['auth', '{bad json']]));
  let adapterCalled = false;

  const adapter: AxiosAdapter = async (config) => {
    adapterCalled = true;
    return {
      config,
      data: { ok: true },
      headers: {},
      status: 200,
      statusText: 'OK',
    };
  };

  await api.get('/health', { adapter });

  assert.equal(adapterCalled, true);
  assert.equal(storage.has('auth'), false);
});

test('does not redirect when login returns unauthorized credentials', async () => {
  const { location, storage } = installBrowserGlobals(new Map([['auth', '{"token":"old"}']]));
  const adapter: AxiosAdapter = async (config) => {
    throw new AxiosError(
      'Unauthorized',
      AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      {
        config,
        data: { message: 'Invalid credentials' },
        headers: {},
        status: 401,
        statusText: 'Unauthorized',
      },
    );
  };

  await assert.rejects(api.post('/auth/login', { username: 'admin', password: 'wrong' }, { adapter }));

  assert.equal(storage.has('auth'), true);
  assert.equal(location.href, '');
});

test('clears client cache when a saved session is rejected', async () => {
  const { storage } = installBrowserGlobals(new Map([['auth', '{"token":"old"}']]));
  writeClientCache('dashboard', { totalClients: 2 }, 30_000);
  const adapter: AxiosAdapter = async (config) => {
    throw new AxiosError(
      'Unauthorized',
      AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      {
        config,
        data: { message: 'Unauthorized' },
        headers: {},
        status: 401,
        statusText: 'Unauthorized',
      },
    );
  };

  await assert.rejects(api.get('/reports/dashboard', { adapter }));

  assert.equal(storage.has('auth'), false);
  assert.equal(readClientCache('dashboard'), null);
});
