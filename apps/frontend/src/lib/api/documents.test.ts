import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadDocumentCapture } from './documents.ts';

test('preserves a non-JSON upload error response and its HTTP status', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('El servicio de documentos no esta disponible.', {
    status: 503,
    headers: { 'content-type': 'text/plain' },
  });

  try {
    await assert.rejects(
      uploadDocumentCapture('capture-token', new FormData()),
      (error: unknown) => {
        assert.equal((error as Error).message, 'El servicio de documentos no esta disponible.');
        assert.equal((error as { response?: Response }).response?.status, 503);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
