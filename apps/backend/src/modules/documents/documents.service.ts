import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  async create(dto: CreateDocumentDto, userId: string) {
    return prisma.document.create({
      data: { ...dto, uploadedById: userId },
    });
  }

  async findAll(clientId?: string, investorId?: string) {
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
