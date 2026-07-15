import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchBackend, getBackendApiUrl } from './auth-session-proxy.ts';

test('prefers the API URL embedded in the deployed frontend build', () => {
  const previousPublicUrl = process.env.NEXT_PUBLIC_API_URL;
  const previousInternalUrl = process.env.INTERNAL_API_URL;
  process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api/v1';
  process.env.INTERNAL_API_URL = 'https://incorrect.example.com';

  try {
    assert.equal(getBackendApiUrl(), 'https://api.example.com/api/v1');
  } finally {
    if (previousPublicUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previousPublicUrl;
    if (previousInternalUrl === undefined) delete process.env.INTERNAL_API_URL;
    else process.env.INTERNAL_API_URL = previousInternalUrl;
  }
});

test('uses the private Cloudflare service binding when it is available', async () => {
  const contextSymbol = Symbol.for('__cloudflare-context__');
  const runtime = globalThis as typeof globalThis & Record<symbol, unknown>;
  const previousContext = runtime[contextSymbol];
  let receivedRequest: Request | undefined;

  runtime[contextSymbol] = {
    env: {
      BACKEND_API: {
        async fetch(request: Request) {
          receivedRequest = request;
          return Response.json({ success: true }, { status: 201 });
        },
      },
    },
    cf: undefined,
    ctx: {},
  };

  try {
    const response = await fetchBackend('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'test' }),
    });

    assert.equal(response.status, 201);
    assert.ok(receivedRequest);
    assert.equal(new URL(receivedRequest.url).pathname, '/api/v1/auth/login');
  } finally {
    if (previousContext === undefined) delete runtime[contextSymbol];
    else runtime[contextSymbol] = previousContext;
  }
});
