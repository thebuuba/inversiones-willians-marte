import assert from 'node:assert/strict';
import test from 'node:test';
import { detectDocumentCropBox } from './document-image-processing.ts';

function image(width: number, height: number, color: [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = 255;
  }
  return { data, width, height };
}

function drawRect(
  target: ReturnType<typeof image>,
  rect: { left: number; top: number; width: number; height: number },
  color: [number, number, number],
) {
  for (let y = rect.top; y < rect.top + rect.height; y += 1) {
    for (let x = rect.left; x < rect.left + rect.width; x += 1) {
      const offset = (y * target.width + x) * 4;
      target.data[offset] = color[0];
      target.data[offset + 1] = color[1];
      target.data[offset + 2] = color[2];
    }
  }
}

test('detects a document area in browser pixel data', () => {
  const target = image(240, 160, [42, 47, 43]);
  drawRect(target, { left: 54, top: 36, width: 130, height: 76 }, [238, 238, 230]);
  const crop = detectDocumentCropBox(target);

  assert.ok(crop);
  assert.ok(crop.left >= 45 && crop.left <= 60);
  assert.ok(crop.top >= 27 && crop.top <= 42);
  assert.ok(crop.width >= 125);
  assert.ok(crop.height >= 70);
});

test('does not crop a uniform image', () => {
  assert.equal(detectDocumentCropBox(image(240, 160, [240, 240, 238])), null);
});
