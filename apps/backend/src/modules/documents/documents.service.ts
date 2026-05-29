import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateDocumentDto } from './dto/create-document.dto';

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

  async remove(id: string) {
    await prisma.document.delete({ where: { id } });
  }
}
