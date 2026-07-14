import { basename, extname } from 'node:path';
import sharp from 'sharp';
import { detectDocumentCropBox } from './document-image-crop';
import {
  configureDocumentImageProcessor,
  type DocumentImageProcessingInput,
} from './document-image-processor';

async function processWithSharp(input: DocumentImageProcessingInput) {
  const outputFilename = `${basename(input.filename, extname(input.filename))}-processed.webp`;

  try {
    const baseImage = sharp(input.contents).rotate();
    const raw = await baseImage
      .clone()
      .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const cropBox = detectDocumentCropBox({
      data: raw.data,
      width: raw.info.width,
      height: raw.info.height,
      channels: raw.info.channels,
    });
    const metadata = await baseImage.metadata();
    const scaleX = metadata.width && raw.info.width ? metadata.width / raw.info.width : 1;
    const scaleY = metadata.height && raw.info.height ? metadata.height / raw.info.height : 1;
    const sourceWidth = metadata.width ?? Math.floor(raw.info.width * scaleX);
    const sourceHeight = metadata.height ?? Math.floor(raw.info.height * scaleY);
    const extractBox = cropBox
      ? {
          left: Math.max(0, Math.min(sourceWidth - 1, Math.floor(cropBox.left * scaleX))),
          top: Math.max(0, Math.min(sourceHeight - 1, Math.floor(cropBox.top * scaleY))),
          width: Math.max(1, Math.min(sourceWidth, Math.floor(cropBox.width * scaleX))),
          height: Math.max(1, Math.min(sourceHeight, Math.floor(cropBox.height * scaleY))),
        }
      : undefined;

    if (extractBox) {
      extractBox.width = Math.min(extractBox.width, sourceWidth - extractBox.left);
      extractBox.height = Math.min(extractBox.height, sourceHeight - extractBox.top);
    }

    let pipeline = sharp(input.contents).rotate();
    if (extractBox) pipeline = pipeline.extract(extractBox);

    const contents = await pipeline
      .normalize()
      .sharpen()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    return { filename: outputFilename, contents };
  } catch {
    return undefined;
  }
}

export function configureSharpDocumentImageProcessor() {
  configureDocumentImageProcessor(processWithSharp);
}
