import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateFaceCrop,
  encodeCanvasWithinLimit,
  findBluePortraitCrop,
} from './face-crop';

function paintRect(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  x: number,
  y: number,
  width: number,
  height: number,
  [red, green, blue]: [number, number, number],
) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const offset = (row * imageWidth + column) * 4;
      pixels[offset] = red;
      pixels[offset + 1] = green;
      pixels[offset + 2] = blue;
      pixels[offset + 3] = 255;
    }
  }
}

test('finds the blue ID portrait panel even when the face covers its center', () => {
  const width = 120;
  const height = 130;
  const pixels = new Uint8ClampedArray(width * height * 4);
  paintRect(pixels, width, 0, 0, width, height, [225, 215, 190]);
  paintRect(pixels, width, 20, 15, 56, 86, [45, 115, 180]);
  paintRect(pixels, width, 34, 29, 28, 50, [150, 95, 75]);
  paintRect(pixels, width, 100, 5, 8, 8, [30, 90, 180]);

  assert.deepEqual(
    findBluePortraitCrop(pixels, width, height, {
      originX: 34,
      originY: 29,
      width: 28,
      height: 50,
    }),
    { x: 20, y: 15, width: 56, height: 86 },
  );
});

test('builds a square face crop with head and shoulder margin', () => {
  const face = { originX: 220, originY: 100, width: 250, height: 320 };
  const crop = calculateFaceCrop(
    face,
    900,
    600,
  );

  assert.equal(crop.width, crop.height);
  assert.ok(crop.x < 220);
  assert.ok(crop.y < 100);
  assert.ok(crop.x + crop.width > 470);
  assert.ok(crop.y + crop.height > 420);
  assert.ok(crop.width >= face.height * 1.75);
  assert.ok(crop.y <= face.originY - face.height * 0.28);
});

test('keeps the square crop inside the image near an edge', () => {
  assert.deepEqual(
    calculateFaceCrop({ originX: 5, originY: 10, width: 100, height: 120 }, 300, 200),
    { x: 0, y: 0, width: 200, height: 200 },
  );
});

test('re-encodes a noisy mobile crop until it fits the upload limit', async () => {
  const attempts: Array<{ type?: string; quality?: number }> = [];
  const canvas = {
    toBlob(
      callback: BlobCallback,
      type?: string,
      quality?: number,
    ) {
      attempts.push({ type, quality });
      const bytes = attempts.length === 1 ? 1_400_000 : 700_000;
      callback(new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }));
    },
  } as HTMLCanvasElement;

  const file = await encodeCanvasWithinLimit(canvas, 'cedula.png', 1_100_000);

  assert.ok(file.size <= 1_100_000);
  assert.equal(file.type, 'image/jpeg');
  assert.equal(file.name, 'cedula.jpg');
  assert.equal(attempts.length, 2);
  assert.ok((attempts[1].quality ?? 1) < (attempts[0].quality ?? 0));
});
