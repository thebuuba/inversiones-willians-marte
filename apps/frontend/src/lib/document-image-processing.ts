import { compressImage, createCompressedImageFile } from './compress-image';

export interface DocumentCropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PixelImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function detectDocumentCropBox(image: PixelImage): DocumentCropBox | null {
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
      const distance = colorDistance(pixel, background);
      const brightnessDelta = brightness(pixel) - brightness(background);
      if (distance < threshold && brightnessDelta < 45) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      matches += 1;
    }
  }

  if (matches === 0 || maxX < minX || maxY < minY) return null;
  const sampledPixels = Math.ceil(image.width / step) * Math.ceil(image.height / step);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const areaRatio = (width * height) / (image.width * image.height);
  if (matches / sampledPixels < 0.05 || areaRatio < 0.12 || areaRatio > 0.96) return null;

  const margin = Math.round(Math.min(image.width, image.height) * 0.025);
  const left = clamp(minX - margin, 0, image.width - 1);
  const top = clamp(minY - margin, 0, image.height - 1);
  const right = clamp(maxX + margin, left + 1, image.width);
  const bottom = clamp(maxY + margin, top + 1, image.height);
  return { left, top, width: right - left, height: bottom - top };
}

function estimateBackground(image: PixelImage): Rgb {
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
  const total = samples.reduce(
    (sum, sample) => ({ r: sum.r + sample.r, g: sum.g + sample.g, b: sum.b + sample.b }),
    { r: 0, g: 0, b: 0 },
  );
  return {
    r: total.r / samples.length,
    g: total.g / samples.length,
    b: total.b / samples.length,
  };
}

function readPixel(image: PixelImage, x: number, y: number): Rgb {
  const offset = (y * image.width + x) * 4;
  return {
    r: image.data[offset] ?? 0,
    g: image.data[offset + 1] ?? 0,
    b: image.data[offset + 2] ?? 0,
  };
}

function colorDistance(a: Rgb, b: Rgb) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function brightness(pixel: Rgb) {
  return pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function loadImage(file: File) {
  return new Promise<{ image: HTMLImageElement; url: string }>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen del documento.'));
    };
    image.src = url;
  });
}

function encodeProcessedCanvas(canvas: HTMLCanvasElement, originalName: string) {
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'documento';
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('No se pudo procesar la imagen del documento.'));
        try {
          resolve(createCompressedImageFile(blob, `${baseName}-processed.webp`));
        } catch (error) {
          reject(error);
        }
      },
      'image/webp',
      0.78,
    );
  });
}

async function createProcessedDocumentImage(file: File): Promise<File | undefined> {
  const { image, url } = await loadImage(file);
  try {
    const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
    const analysis = document.createElement('canvas');
    analysis.width = Math.max(1, Math.round(image.naturalWidth * scale));
    analysis.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const analysisContext = analysis.getContext('2d', { willReadFrequently: true });
    if (!analysisContext) return undefined;
    analysisContext.drawImage(image, 0, 0, analysis.width, analysis.height);
    const pixels = analysisContext.getImageData(0, 0, analysis.width, analysis.height);
    const detected = detectDocumentCropBox(pixels);
    const source = detected
      ? {
          left: Math.round(detected.left / scale),
          top: Math.round(detected.top / scale),
          width: Math.round(detected.width / scale),
          height: Math.round(detected.height / scale),
        }
      : { left: 0, top: 0, width: image.naturalWidth, height: image.naturalHeight };
    const outputScale = Math.min(1, 1800 / Math.max(source.width, source.height));
    const output = document.createElement('canvas');
    output.width = Math.max(1, Math.round(source.width * outputScale));
    output.height = Math.max(1, Math.round(source.height * outputScale));
    const outputContext = output.getContext('2d');
    if (!outputContext) return undefined;
    outputContext.drawImage(
      image,
      source.left,
      source.top,
      source.width,
      source.height,
      0,
      0,
      output.width,
      output.height,
    );
    return await encodeProcessedCanvas(output, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function appendDocumentUploadFiles(formData: FormData, file: File) {
  if (!file.type.startsWith('image/')) {
    formData.append('file', file);
    return;
  }

  const [original, processed] = await Promise.all([
    compressImage(file, 1800, 0.82),
    createProcessedDocumentImage(file).catch(() => undefined),
  ]);
  formData.append('file', original);
  if (processed?.type === 'image/webp') formData.append('processedFile', processed);
}
