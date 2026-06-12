export interface RawImageInput {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

export interface CropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function detectDocumentCropBox(image: RawImageInput): CropBox | null {
  const background = estimateBackground(image);
  const threshold = 55;
  const step = Math.max(1, Math.floor(Math.min(image.width, image.height) / 260));

  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  let matches = 0;

  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      const pixel = readPixel(image, x, y);
      if (!isLikelyDocumentPixel(pixel, background, threshold)) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      matches += 1;
    }
  }

  if (matches === 0 || maxX < minX || maxY < minY) return null;

  const sampledPixels = Math.ceil(image.width / step) * Math.ceil(image.height / step);
  const coverage = matches / sampledPixels;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const areaRatio = (width * height) / (image.width * image.height);

  if (coverage < 0.05 || areaRatio < 0.12 || areaRatio > 0.96) return null;

  const margin = Math.round(Math.min(image.width, image.height) * 0.025);
  const left = clamp(minX - margin, 0, image.width - 1);
  const top = clamp(minY - margin, 0, image.height - 1);
  const right = clamp(maxX + margin, left + 1, image.width);
  const bottom = clamp(maxY + margin, top + 1, image.height);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function estimateBackground(image: RawImageInput): Rgb {
  const sampleSize = Math.max(6, Math.floor(Math.min(image.width, image.height) * 0.08));
  const samples: Rgb[] = [];
  const corners = [
    { left: 0, top: 0 },
    { left: image.width - sampleSize, top: 0 },
    { left: 0, top: image.height - sampleSize },
    { left: image.width - sampleSize, top: image.height - sampleSize },
  ];

  for (const corner of corners) {
    for (let y = corner.top; y < corner.top + sampleSize; y += 2) {
      for (let x = corner.left; x < corner.left + sampleSize; x += 2) {
        samples.push(readPixel(image, x, y));
      }
    }
  }

  return average(samples);
}

function isLikelyDocumentPixel(pixel: Rgb, background: Rgb, threshold: number) {
  const distance = colorDistance(pixel, background);
  const brightnessDelta = brightness(pixel) - brightness(background);
  return distance >= threshold || brightnessDelta >= 45;
}

function readPixel(image: RawImageInput, x: number, y: number): Rgb {
  const offset = (y * image.width + x) * image.channels;
  return {
    r: image.data[offset] ?? 0,
    g: image.data[offset + 1] ?? 0,
    b: image.data[offset + 2] ?? 0,
  };
}

function average(samples: Rgb[]): Rgb {
  const total = samples.reduce(
    (sum, sample) => ({
      r: sum.r + sample.r,
      g: sum.g + sample.g,
      b: sum.b + sample.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: total.r / samples.length,
    g: total.g / samples.length,
    b: total.b / samples.length,
  };
}

function colorDistance(a: Rgb, b: Rgb) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function brightness(pixel: Rgb) {
  return pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
