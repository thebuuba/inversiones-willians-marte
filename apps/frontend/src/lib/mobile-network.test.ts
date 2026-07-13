import assert from 'node:assert/strict';
import test from 'node:test';
import { getAllowedDevOrigins, selectLanAddress } from './mobile-network';

test('prefers a non-internal Wi-Fi IPv4 address for mobile capture links', () => {
  assert.equal(
    selectLanAddress({
      lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      bridge0: [{ address: '172.17.0.1', family: 'IPv4', internal: false }],
      en0: [{ address: '192.168.1.44', family: 'IPv4', internal: false }],
    }),
    '192.168.1.44',
  );
});

test('returns undefined when no LAN IPv4 address is available', () => {
  assert.equal(
    selectLanAddress({
      lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    }),
    undefined,
  );
});

test('allows both the configured host and LAN addresses for mobile development', () => {
  assert.deepEqual(
    getAllowedDevOrigins('http://localhost:3001', {
      lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      en0: [{ address: '192.168.1.13', family: 'IPv4', internal: false }],
      bridge0: [{ address: '172.17.0.1', family: 4, internal: false }],
    }),
    ['localhost', '192.168.1.13', '172.17.0.1'],
  );
});
