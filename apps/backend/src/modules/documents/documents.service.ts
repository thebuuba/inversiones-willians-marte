import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { join, normalize } from 'path';
import { AuditService } from '../audit/audit.service';
import {
  DocumentProcessingResult,
  DocumentProcessingService,
  UploadedDocumentFile,
} from './document-processing.service';

interface CreateDocumentInput {
  name: string;
  category: string;
  clientId?: number;
  investorId?: string;
  loanId?: string;
  notes?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedFile?: UploadedDocumentFile;
}

@Injectable()
export class DocumentsService {
  constructor(
    private audit: AuditService,
    private documentProcessing: DocumentProcessingService,
  ) {}

  private readonly uploadsDir = join(__dirname, '..', '..', '..', 'uploads');

  async create(dto: CreateDocumentInput, userId: string) {
    const processing = dto.uploadedFile
      ? await this.documentProcessing.analyze(dto.uploadedFile)
      : this.defaultProcessing(dto.fileUrl);

    return prisma.document.create({
      data: {
        name: dto.name,
        category: dto.category,
        clientId: dto.clientId ?? null,
        investorId: dto.investorId ?? null,
        loanId: dto.loanId ?? null,
        notes: dto.notes ?? null,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        originalFileUrl: processing.originalFileUrl,
        processedFileUrl: processing.processedFileUrl ?? null,
        documentType: processing.documentType,
        detectionConfidence: processing.detectionConfidence,
        processingStatus: processing.processingStatus,
        processingNotes: processing.processingNotes ?? null,
        uploadedById: userId,
      },
    });
  }

  private defaultProcessing(fileUrl: string): DocumentProcessingResult {
    return {
      originalFileUrl: fileUrl,
      documentType: 'otro',
      detectionConfidence: 0,
      processingStatus: 'not_applicable',
      processingNotes: 'Documento creado sin archivo analizable.',
    };
  }

  async findAll(clientId?: number, investorId?: string) {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (investorId) where.investorId = investorId;
    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      documents.map(async (document) => {
        if (
          document.fileUrl &&
          document.mimeType?.startsWith('image/') &&
          !document.processedFileUrl &&
          document.processingStatus === 'needs_review'
        ) {
          const processing = await this.documentProcessing.analyze({
            filename: document.fileUrl,
            originalname: document.name,
            mimetype: document.mimeType,
          });

          if (processing.processedFileUrl) {
            return prisma.document.update({
              where: { id: document.id },
              data: {
                processedFileUrl: processing.processedFileUrl,
                processingStatus: processing.processingStatus,
                processingNotes: processing.processingNotes ?? null,
              },
            });
          }
        }

        return document;
      }),
    );
  }

  async getFileForDownload(id: string, preferProcessed = false) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document?.fileUrl) throw new NotFoundException('Document file not found');

    const storedFile = preferProcessed && document.processedFileUrl ? document.processedFileUrl : document.fileUrl;
    const filename = normalize(storedFile).replace(/^(\.\.(\/|\\|$))+/, '');
    const path = join(this.uploadsDir, filename);

    if (!path.startsWith(this.uploadsDir)) {
      throw new NotFoundException('Document file not found');
    }

    return {
      path,
      filename: document.name,
      mimeType: preferProcessed && document.processedFileUrl ? 'image/webp' : document.mimeType ?? 'application/octet-stream',
    };
  }

  async remove(id: string, userId: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    await prisma.document.delete({ where: { id } });
    if (document?.clientId) {
      await this.audit.log({
        userId,
        clientId: document.clientId,
        entityType: 'Document',
        entityId: document.id,
        action: 'DOCUMENT_DELETED',
        newValues: { name: document.name },
      });
    }
  }
}
