import assert from 'node:assert/strict';
import test from 'node:test';
import { getBackendApiUrl } from './auth-session-proxy.ts';

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
