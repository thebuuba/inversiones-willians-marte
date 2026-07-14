import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { FileStorageService } from '../../common/storage/file-storage.service';
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
  private readonly logger = new Logger(DocumentsService.name);
  constructor(
    private audit: AuditService,
    private documentProcessing: DocumentProcessingService,
    private storage: FileStorageService,
  ) {}

  async create(dto: CreateDocumentInput, userId: string) {
    const processing = dto.uploadedFile
      ? await this.documentProcessing.analyze(dto.uploadedFile)
      : this.defaultProcessing(dto.fileUrl);

    try {
      if (dto.uploadedFile?.buffer) {
        await this.storage.put(dto.fileUrl, dto.uploadedFile.buffer, dto.mimeType);
      }
      if (processing.processedFileUrl && processing.processedContents) {
        await this.storage.put(
          processing.processedFileUrl,
          processing.processedContents,
          'image/webp',
        );
      }
      return await prisma.document.create({
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
    } catch (error) {
      await this.removeStoredFiles([
        dto.fileUrl,
        processing.originalFileUrl,
        processing.processedFileUrl,
      ]);
      throw error;
    }
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

  async findAll(clientId?: number, investorId?: string, take = 100, skip = 0) {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (investorId) where.investorId = investorId;
    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async updateName(id: string, name: string, userId: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    const normalizedName = name.trim();
    const updated = await prisma.document.update({
      where: { id },
      data: { name: normalizedName },
    });

    if (document.clientId) {
      await this.audit.log({
        userId,
        clientId: document.clientId,
        entityType: 'Document',
        entityId: document.id,
        action: 'DOCUMENT_RENAMED',
        oldValues: { name: document.name },
        newValues: { name: normalizedName },
      });
    }

    return updated;
  }

  async getFileForDownload(id: string, preferProcessed = false) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document?.fileUrl) throw new NotFoundException('Document file not found');

    const candidates =
      preferProcessed && document.processedFileUrl
        ? [
            { storedFile: document.processedFileUrl, mimeType: 'image/webp' },
            { storedFile: document.fileUrl, mimeType: document.mimeType },
          ]
        : [{ storedFile: document.fileUrl, mimeType: document.mimeType }];
    for (const candidate of candidates) {
      const contents = await this.storage.get(candidate.storedFile);
      if (contents) {
        return {
          contents,
          filename: document.name,
          mimeType: candidate.mimeType ?? 'application/octet-stream',
        };
      }
    }

    throw new NotFoundException('Document file not found');
  }

  async remove(id: string, userId: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    await prisma.document.delete({ where: { id } });
    await this.removeStoredFiles([
      document.fileUrl,
      document.originalFileUrl,
      document.processedFileUrl,
    ]);
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

  private async removeStoredFiles(filenames: Array<string | null | undefined>) {
    const uniqueFilenames = new Set(filenames.filter((value): value is string => Boolean(value)));
    try {
      await this.storage.delete([...uniqueFilenames]);
    } catch (error) {
      this.logger.error('No se pudieron eliminar uno o mas archivos almacenados', error);
    }
  }
}
