import assert from 'node:assert/strict';
import test from 'node:test';
import { writeClientCache, readClientCache } from './client-cache.ts';
import { AUTH_STORAGE_KEY, clearStoredAuth, loadStoredAuthSession, saveStoredAuth } from './auth-session.ts';

function installStorage(storage = new Map<string, string>(), session = new Map<string, string>()) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => session.set(key, value),
      removeItem: (key: string) => session.delete(key),
    },
  });

  return { storage, session };
}

test('validates stored auth with the backend profile before accepting it', async () => {
  const { storage } = installStorage(
    new Map([
      [
        'auth',
        JSON.stringify({
          token: 'valid-token',
          user: { id: 'old', name: 'Old Name', email: 'old@example.com', role: 'ADMIN' },
        }),
      ],
    ]),
  );

  const auth = await loadStoredAuthSession(async () => ({
    id: 'fresh',
    name: 'Fresh Name',
    email: 'fresh@example.com',
    role: 'ADMIN',
  }));

  assert.equal(storage.has('auth'), true);
  assert.equal(auth.token, 'valid-token');
  assert.equal(auth.user?.id, 'fresh');
});

test('clears stored auth and client cache when backend rejects the saved token', async () => {
  const { storage } = installStorage(new Map([['auth', JSON.stringify({ token: 'expired-token', user: null })]]));
  writeClientCache('dashboard', { activeLoans: 2 }, 30_000);

  const auth = await loadStoredAuthSession(async () => {
    throw new Error('Unauthorized');
  });

  assert.deepEqual(auth, { user: null, token: null });
  assert.equal(storage.has('auth'), false);
  assert.equal(readClientCache('dashboard'), null);
});

test('stores non-remembered auth only for the browser session', () => {
  const { storage, session } = installStorage();

  saveStoredAuth({ user: null, token: 'session-token' }, false);

  assert.equal(storage.has(AUTH_STORAGE_KEY), false);
  assert.equal(JSON.parse(session.get(AUTH_STORAGE_KEY) ?? '{}').token, 'session-token');
});

test('stores remembered auth persistently', () => {
  const { storage, session } = installStorage();

  saveStoredAuth({ user: null, token: 'persistent-token' }, true);

  assert.equal(session.has(AUTH_STORAGE_KEY), false);
  assert.equal(JSON.parse(storage.get(AUTH_STORAGE_KEY) ?? '{}').token, 'persistent-token');
});

test('clearing auth is safe without browser storage', () => {
  Reflect.deleteProperty(globalThis, 'localStorage');
  Reflect.deleteProperty(globalThis, 'sessionStorage');

  assert.doesNotThrow(() => clearStoredAuth());
});
