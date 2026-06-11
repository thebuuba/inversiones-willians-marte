import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import sharp from 'sharp';
import { detectDocumentCropBox } from './document-image-crop';

export type DetectedDocumentType = 'cedula' | 'recibo' | 'acto_notarial' | 'otro';
export type DocumentProcessingStatus = 'processed' | 'needs_review' | 'failed' | 'not_applicable';

export interface UploadedDocumentFile {
  originalname: string;
  filename: string;
  mimetype: string;
}

export interface DocumentProcessingResult {
  originalFileUrl: string;
  processedFileUrl?: string;
  documentType: DetectedDocumentType;
  detectionConfidence: number;
  processingStatus: DocumentProcessingStatus;
  processingNotes?: string;
}

@Injectable()
export class DocumentProcessingService {
  private readonly uploadsDir = join(__dirname, '..', '..', '..', 'uploads');

  async analyze(file: UploadedDocumentFile): Promise<DocumentProcessingResult> {
    const isImage = file.mimetype.startsWith('image/');
    const detection = this.detectType(file);
    const processedFileUrl = isImage ? await this.processImage(file.filename) : undefined;

    return {
      originalFileUrl: file.filename,
      processedFileUrl,
      documentType: detection.documentType,
      detectionConfidence: detection.detectionConfidence,
      processingStatus: isImage ? (processedFileUrl ? 'processed' : 'needs_review') : 'not_applicable',
      processingNotes: this.processingNotes(isImage, Boolean(processedFileUrl)),
    };
  }

  private async processImage(filename: string) {
    const inputPath = join(this.uploadsDir, filename);
    if (!inputPath.startsWith(this.uploadsDir) || !existsSync(inputPath)) return undefined;

    const outputFilename = `${basename(filename, extname(filename))}-processed.webp`;
    const outputPath = join(this.uploadsDir, outputFilename);

    try {
      const baseImage = sharp(inputPath).rotate();
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

      let pipeline = sharp(inputPath).rotate();
      if (extractBox) pipeline = pipeline.extract(extractBox);

      await pipeline
        .normalize()
        .sharpen()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88 })
        .toFile(outputPath);
      return outputFilename;
    } catch {
      return undefined;
    }
  }

  private processingNotes(isImage: boolean, processed: boolean) {
    if (!isImage) return 'El recorte automatico solo aplica a imagenes en esta version.';
    if (processed) return 'Area del documento detectada, recortada y mejorada automaticamente.';
    return 'No se pudo recortar automaticamente; revisar imagen original.';
  }

  private detectType(file: UploadedDocumentFile): {
    documentType: DetectedDocumentType;
    detectionConfidence: number;
  } {
    const text = this.normalize(`${file.originalname} ${file.filename}`);

    if (this.includesAny(text, ['cedula', 'identidad', 'id dominicana', 'documento identidad'])) {
      return { documentType: 'cedula', detectionConfidence: 92 };
    }

    if (this.includesAny(text, ['recibo', 'comprobante', 'pago', 'deposito', 'transferencia', 'voucher'])) {
      return { documentType: 'recibo', detectionConfidence: 88 };
    }

    if (this.includesAny(text, ['acto notarial', 'notarial', 'notario', 'legalizado'])) {
      return { documentType: 'acto_notarial', detectionConfidence: 90 };
    }

    return {
      documentType: 'otro',
      detectionConfidence: file.mimetype.startsWith('image/') ? 35 : 20,
    };
  }

  private includesAny(text: string, hints: string[]) {
    return hints.some((hint) => text.includes(hint));
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
