import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompressedImageFile } from './compress-image.ts';

test('keeps the actual PNG type when canvas falls back from WebP', () => {
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const blob = new Blob([pngBytes], { type: 'image/png' });

  const file = createCompressedImageFile(blob, 'foto-camara.jpg');

  assert.equal(file.type, 'image/png');
  assert.equal(file.name, 'foto-camara.png');
});
