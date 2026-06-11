import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import sharp from 'sharp';

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
      await sharp(inputPath)
        .rotate()
        .trim({ threshold: 12 })
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
    if (processed) return 'Imagen recortada y mejorada automaticamente.';
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
