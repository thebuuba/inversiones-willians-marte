import assert from 'node:assert/strict';
import test from 'node:test';
import { getNetworkStatusMessage } from './network-status.ts';

test('prioritizes offline status over backend status', () => {
  assert.equal(
    getNetworkStatusMessage({ online: false, backendUnavailable: true, staleData: true }),
    'Sin conexión. Mostrando datos guardados cuando estén disponibles.',
  );
});

test('reports backend outages when the device is online', () => {
  assert.equal(
    getNetworkStatusMessage({ online: true, backendUnavailable: true, staleData: false }),
    'No se pudo conectar con el servidor. Reintentaremos cuando vuelva.',
  );
});

test('reports stale data fallback when cached data is shown after a failed refresh', () => {
  assert.equal(
    getNetworkStatusMessage({ online: true, backendUnavailable: false, staleData: true }),
    'Mostrando datos guardados mientras se actualiza la conexión.',
  );
});

test('returns an empty message when the network state is healthy', () => {
  assert.equal(
    getNetworkStatusMessage({ online: true, backendUnavailable: false, staleData: false }),
    '',
  );
});
