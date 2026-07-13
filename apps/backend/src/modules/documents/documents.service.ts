import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { access, unlink } from 'fs/promises';
import { join, resolve, sep } from 'path';
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
  ) {}

  private readonly uploadsDir = join(__dirname, '..', '..', '..', 'uploads');

  async create(dto: CreateDocumentInput, userId: string) {
    const processing = dto.uploadedFile
      ? await this.documentProcessing.analyze(dto.uploadedFile)
      : this.defaultProcessing(dto.fileUrl);

    try {
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
    const uploadsRoot = resolve(this.uploadsDir);

    for (const candidate of candidates) {
      const path = resolve(uploadsRoot, candidate.storedFile);
      if (!path.startsWith(`${uploadsRoot}${sep}`)) continue;

      try {
        await access(path);
        return {
          path,
          filename: document.name,
          mimeType: candidate.mimeType ?? 'application/octet-stream',
        };
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT' && code !== 'ENOTDIR') throw error;
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
    const uploadsRoot = resolve(this.uploadsDir);
    const uniqueFilenames = new Set(filenames.filter((value): value is string => Boolean(value)));

    await Promise.all(
      [...uniqueFilenames].map(async (filename) => {
        const filePath = resolve(uploadsRoot, filename);
        if (!filePath.startsWith(`${uploadsRoot}${sep}`)) return;
        try {
          await unlink(filePath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            this.logger.error(`No se pudo eliminar el archivo ${filename}`, error);
          }
        }
      }),
    );
  }
}
