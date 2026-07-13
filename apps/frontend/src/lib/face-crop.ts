import type { BoundingBox, FaceDetector as MediaPipeFaceDetector } from '@mediapipe/tasks-vision';
import { createCompressedImageFile } from './compress-image';

const MEDIAPIPE_VERSION = '0.10.35';
const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';

export interface FaceCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

let detectorPromise: Promise<MediaPipeFaceDetector> | undefined;

function isMediaPipeInfoMessage(args: unknown[]) {
  return args.map(String).join(' ').includes('Created TensorFlow Lite XNNPACK delegate for CPU');
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function calculateFaceCrop(
  face: Pick<BoundingBox, 'originX' | 'originY' | 'width' | 'height'>,
  imageWidth: number,
  imageHeight: number,
): FaceCropArea {
  const side = Math.round(
    Math.min(Math.max(face.width * 2, face.height * 1.8), imageWidth, imageHeight),
  );
  const centerX = face.originX + face.width / 2;
  const centerY = face.originY + face.height / 2 + face.height * 0.08;
  const x = Math.round(clamp(centerX - side / 2, 0, imageWidth - side));
  const y = Math.round(clamp(centerY - side / 2, 0, imageHeight - side));

  return { x, y, width: side, height: side };
}

function isBluePixel(pixels: Uint8ClampedArray, offset: number) {
  const red = pixels[offset] / 255;
  const green = pixels[offset + 1] / 255;
  const blue = pixels[offset + 2] / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  if (maximum < 0.18 || difference === 0) return false;

  let hue: number;
  if (maximum === red) hue = 60 * (((green - blue) / difference) % 6);
  else if (maximum === green) hue = 60 * ((blue - red) / difference + 2);
  else hue = 60 * ((red - green) / difference + 4);
  if (hue < 0) hue += 360;

  const saturation = difference / maximum;
  return hue >= 175 && hue <= 250 && saturation >= 0.25;
}

export function findBluePortraitCrop(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  face: Pick<BoundingBox, 'originX' | 'originY' | 'width' | 'height'>,
): FaceCropArea | null {
  const pixelCount = imageWidth * imageHeight;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const faceCenterX = face.originX + face.width / 2;
  const faceCenterY = face.originY + face.height / 2;
  let best: (FaceCropArea & { pixels: number }) | null = null;

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || !isBluePixel(pixels, start * 4)) continue;
    visited[start] = 1;
    let head = 0;
    let tail = 1;
    queue[0] = start;
    let minimumX = imageWidth;
    let minimumY = imageHeight;
    let maximumX = 0;
    let maximumY = 0;
    let componentPixels = 0;

    while (head < tail) {
      const current = queue[head++];
      const x = current % imageWidth;
      const y = Math.floor(current / imageWidth);
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
      componentPixels += 1;

      const neighbors = [
        x > 0 ? current - 1 : -1,
        x + 1 < imageWidth ? current + 1 : -1,
        y > 0 ? current - imageWidth : -1,
        y + 1 < imageHeight ? current + imageWidth : -1,
      ];
      for (const neighbor of neighbors) {
        if (
          neighbor >= 0 &&
          !visited[neighbor] &&
          isBluePixel(pixels, neighbor * 4)
        ) {
          visited[neighbor] = 1;
          queue[tail++] = neighbor;
        }
      }
    }

    const containsFaceCenter =
      faceCenterX >= minimumX &&
      faceCenterX <= maximumX &&
      faceCenterY >= minimumY &&
      faceCenterY <= maximumY;
    if (
      containsFaceCenter &&
      componentPixels >= pixelCount * 0.005 &&
      (!best || componentPixels > best.pixels)
    ) {
      best = {
        x: minimumX,
        y: minimumY,
        width: maximumX - minimumX + 1,
        height: maximumY - minimumY + 1,
        pixels: componentPixels,
      };
    }
  }

  return best && { x: best.x, y: best.y, width: best.width, height: best.height };
}

function detectBluePortraitArea(
  image: HTMLImageElement,
  face: Pick<BoundingBox, 'originX' | 'originY' | 'width' | 'height'>,
) {
  const analysisScale = Math.min(1, 500 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * analysisScale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * analysisScale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const scaledFace = {
    originX: face.originX * analysisScale,
    originY: face.originY * analysisScale,
    width: face.width * analysisScale,
    height: face.height * analysisScale,
  };
  const crop = findBluePortraitCrop(imageData.data, canvas.width, canvas.height, scaledFace);
  if (!crop) return null;

  return {
    x: Math.round(crop.x / analysisScale),
    y: Math.round(crop.y / analysisScale),
    width: Math.round(crop.width / analysisScale),
    height: Math.round(crop.height / analysisScale),
  };
}

async function getFaceDetector() {
  detectorPromise ??= (async () => {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      if (isMediaPipeInfoMessage(args)) return;
      originalConsoleError(...args);
    };

    try {
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      return await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.55,
      });
    } finally {
      console.error = originalConsoleError;
    }
  })();
  return detectorPromise;
}

function loadImage(file: File): Promise<{ image: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la fotografía.'));
    };
    image.src = url;
  });
}

function encodeCanvas(canvas: HTMLCanvasElement, originalName: string, quality: number) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar el recorte del rostro.'));
          return;
        }
        try {
          resolve(createCompressedImageFile(blob, originalName));
        } catch (error) {
          reject(error);
        }
      },
      'image/jpeg',
      quality,
    );
  });
}

export async function encodeCanvasWithinLimit(
  canvas: HTMLCanvasElement,
  originalName: string,
  maxBytes: number,
  initialQuality = 0.8,
): Promise<File> {
  const qualities = [initialQuality, 0.68, 0.54, 0.42].filter(
    (quality, index, values) => index === 0 || quality < values[index - 1],
  );

  for (const quality of qualities) {
    const file = await encodeCanvas(canvas, originalName, quality);
    if (file.size <= maxBytes) return file;
  }

  throw new Error('La fotografía no pudo reducirse al tamaño permitido.');
}

function detectFaces(detector: MediaPipeFaceDetector, image: HTMLImageElement) {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (isMediaPipeInfoMessage(args)) return;
    originalConsoleError(...args);
  };

  try {
    return detector.detect(image).detections;
  } finally {
    console.error = originalConsoleError;
  }
}

export async function cropClientPhotoToFace(
  file: File,
  outputSize = 800,
  quality = 0.8,
  maxBytes = 1_100_000,
): Promise<File> {
  const [{ image, url }, detector] = await Promise.all([loadImage(file), getFaceDetector()]);

  try {
    const detections = detectFaces(detector, image).filter((item) => item.boundingBox);
    const largestFace = detections.sort((left, right) => {
      const leftBox = left.boundingBox!;
      const rightBox = right.boundingBox!;
      return rightBox.width * rightBox.height - leftBox.width * leftBox.height;
    })[0]?.boundingBox;

    if (!largestFace) {
      throw new Error(
        'No se detectó un rostro. Acerca la cámara, evita reflejos y vuelve a intentarlo.',
      );
    }

    const crop =
      detectBluePortraitArea(image, largestFace) ??
      calculateFaceCrop(largestFace, image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    const outputScale = Math.min(1, outputSize / Math.max(crop.width, crop.height));
    canvas.width = Math.max(1, Math.round(crop.width * outputScale));
    canvas.height = Math.max(1, Math.round(crop.height * outputScale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no pudo procesar la fotografía.');
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return await encodeCanvasWithinLimit(canvas, file.name, maxBytes, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
