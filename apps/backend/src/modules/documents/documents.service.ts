import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { join, normalize } from 'path';
import { AuditService } from '../audit/audit.service';

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
}

@Injectable()
export class DocumentsService {
  constructor(private audit: AuditService) {}

  private readonly uploadsDir = join(__dirname, '..', '..', '..', 'uploads');

  async create(dto: CreateDocumentInput, userId: string) {
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
        uploadedById: userId,
      },
    });
  }

  async findAll(clientId?: number, investorId?: string) {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (investorId) where.investorId = investorId;
    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFileForDownload(id: string) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document?.fileUrl) throw new NotFoundException('Document file not found');

    const filename = normalize(document.fileUrl).replace(/^(\.\.(\/|\\|$))+/, '');
    const path = join(this.uploadsDir, filename);

    if (!path.startsWith(this.uploadsDir)) {
      throw new NotFoundException('Document file not found');
    }

    return {
      path,
      filename: document.name,
      mimeType: document.mimeType ?? 'application/octet-stream',
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
