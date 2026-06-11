import { Injectable } from '@nestjs/common';

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
  async analyze(file: UploadedDocumentFile): Promise<DocumentProcessingResult> {
    const isImage = file.mimetype.startsWith('image/');
    const detection = this.detectType(file);

    return {
      originalFileUrl: file.filename,
      documentType: detection.documentType,
      detectionConfidence: detection.detectionConfidence,
      processingStatus: isImage ? 'needs_review' : 'not_applicable',
      processingNotes: isImage
        ? 'Documento detectado; recorte automatico pendiente de motor de imagen.'
        : 'El recorte automatico solo aplica a imagenes en esta version.',
    };
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
