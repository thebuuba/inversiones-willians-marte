import { detectDocumentCropBox } from './document-image-crop';

function rgbImage(width: number, height: number, fill: [number, number, number]) {
  const data = Buffer.alloc(width * height * 3);
  for (let offset = 0; offset < data.length; offset += 3) {
    data[offset] = fill[0];
    data[offset + 1] = fill[1];
    data[offset + 2] = fill[2];
  }
  return data;
}

function drawRect(
  data: Buffer,
  width: number,
  rect: { left: number; top: number; width: number; height: number },
  color: [number, number, number],
) {
  for (let y = rect.top; y < rect.top + rect.height; y += 1) {
    for (let x = rect.left; x < rect.left + rect.width; x += 1) {
      const offset = (y * width + x) * 3;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
    }
  }
}

describe('detectDocumentCropBox', () => {
  it('finds a bright document area on a dark background', () => {
    const data = rgbImage(240, 160, [42, 47, 43]);
    drawRect(data, 240, { left: 54, top: 36, width: 130, height: 76 }, [238, 238, 230]);

    expect(detectDocumentCropBox({ data, width: 240, height: 160, channels: 3 })).toMatchObject({
      left: expect.any(Number),
      top: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
    });

    const box = detectDocumentCropBox({ data, width: 240, height: 160, channels: 3 });
    expect(box?.left).toBeGreaterThanOrEqual(45);
    expect(box?.left).toBeLessThanOrEqual(60);
    expect(box?.top).toBeGreaterThanOrEqual(27);
    expect(box?.top).toBeLessThanOrEqual(42);
    expect(box?.width).toBeGreaterThanOrEqual(125);
    expect(box?.height).toBeGreaterThanOrEqual(70);
  });

  it('returns null for an image without a detectable document region', () => {
    const data = rgbImage(240, 160, [240, 240, 238]);

    expect(detectDocumentCropBox({ data, width: 240, height: 160, channels: 3 })).toBeNull();
  });
});
