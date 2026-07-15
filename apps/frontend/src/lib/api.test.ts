import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError, type AxiosAdapter } from 'axios';
import { api, sessionApi } from './api.ts';
import { readClientCache, writeClientCache } from './client-cache.ts';

function installBrowserGlobals(storage = new Map<string, string>(), session = new Map<string, string>()) {
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
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    },
    sessionStorage: {
      configurable: true,
      value: {
        getItem: (key: string) => session.get(key) ?? null,
        setItem: (key: string, value: string) => session.set(key, value),
        removeItem: (key: string) => session.delete(key),
      },
    },
  });

  return { location, storage, session };
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

test('adds authorization and migrates session-only auth to persistent storage', async () => {
  const { storage, session } = installBrowserGlobals(new Map(), new Map([['auth', '{"token":"session-token"}']]));
  let authorization: unknown;
  const adapter: AxiosAdapter = async (config) => {
    authorization = config.headers?.Authorization;
    return {
      config,
      data: { ok: true },
      headers: {},
      status: 200,
      statusText: 'OK',
    };
  };

  await api.get('/health', { adapter });

  assert.equal(session.has('auth'), false);
  assert.equal(JSON.parse(storage.get('auth') ?? '{}').token, 'session-token');
  assert.equal(authorization, 'Bearer session-token');
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

  const originalSessionAdapter = sessionApi.defaults.adapter;
  sessionApi.defaults.adapter = async (config) => {
    throw new AxiosError(
      'Unauthorized',
      AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      {
        config,
        data: { message: 'Session expired' },
        headers: {},
        status: 401,
        statusText: 'Unauthorized',
      },
    );
  };

  try {
    await assert.rejects(api.get('/reports/dashboard', { adapter }));
  } finally {
    sessionApi.defaults.adapter = originalSessionAdapter;
  }

  assert.equal(storage.has('auth'), false);
  assert.equal(readClientCache('dashboard'), null);
});

test('refreshes an expired access token once and retries the original request', async () => {
  const { location, storage } = installBrowserGlobals(
    new Map([
      [
        'auth',
        JSON.stringify({
          token: 'expired-access-token',
          user: { id: 'user-1', name: 'Nata', email: 'nata@example.com', role: 'ADMIN' },
        }),
      ],
    ]),
  );
  const authorizations: unknown[] = [];
  let attempts = 0;
  const adapter: AxiosAdapter = async (config) => {
    attempts += 1;
    authorizations.push(config.headers?.Authorization);
    if (attempts === 1) {
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
    }
    return { config, data: { ok: true }, headers: {}, status: 200, statusText: 'OK' };
  };
  const originalSessionAdapter = sessionApi.defaults.adapter;
  sessionApi.defaults.adapter = async (config) => ({
    config,
    data: {
      success: true,
      data: {
        accessToken: 'fresh-access-token',
        user: { id: 'user-1', name: 'Nata', email: 'nata@example.com', role: 'ADMIN' },
      },
    },
    headers: {},
    status: 200,
    statusText: 'OK',
  });

  try {
    await api.get('/reports/dashboard', { adapter });
  } finally {
    sessionApi.defaults.adapter = originalSessionAdapter;
  }

  assert.deepEqual(authorizations, ['Bearer expired-access-token', 'Bearer fresh-access-token']);
  assert.equal(JSON.parse(storage.get('auth') ?? '{}').token, 'fresh-access-token');
  assert.equal(location.href, '');
});
