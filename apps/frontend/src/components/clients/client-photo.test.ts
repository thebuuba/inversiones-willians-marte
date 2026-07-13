import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MAX_CLIENT_PHOTO_BYTES, validateClientPhoto } from './client-photo.ts';

test('accepts supported client profile photographs', () => {
  assert.equal(validateClientPhoto({ type: 'image/jpeg', size: 500_000 }), null);
  assert.equal(validateClientPhoto({ type: 'image/png', size: 500_000 }), null);
});

test('rejects unsupported or oversized client profile photographs', () => {
  assert.match(validateClientPhoto({ type: 'image/gif', size: 100 }) ?? '', /JPG/);
  assert.match(
    validateClientPhoto({ type: 'image/jpeg', size: MAX_CLIENT_PHOTO_BYTES + 1 }) ?? '',
    /5 MB/,
  );
});

test('offers QR capture in the shared create and edit client photo uploader', async () => {
  const source = await readFile(new URL('./add-client-page.tsx', import.meta.url), 'utf8');

  assert.match(source, /Tomar con celular/);
  assert.match(source, /captura-foto-cliente/);
  assert.match(source, /getClientPhotoCaptureStatus/);
});
