import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  async create(dto: CreateRequestDto, userId: string) {
    const count = await prisma.loanRequest.count();
    const code = `SOL-${String(count + 1).padStart(4, '0')}`;

    return prisma.loanRequest.create({
      data: {
        ...dto,
        amount: dto.amount,
        code,
        createdById: userId,
        clientId: dto.clientId ?? null,
      },
      include: { createdBy: { select: { name: true } }, client: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findAll() {
    return prisma.loanRequest.findMany({
      include: { createdBy: { select: { name: true } }, client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await prisma.loanRequest.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true } }, client: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async approve(id: string) {
    const request = await this.findOne(id);
    if (request.status !== 'PENDING') throw new BadRequestException('Only pending requests can be approved');

    return prisma.loanRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { createdBy: { select: { name: true } }, client: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async reject(id: string) {
    const request = await this.findOne(id);
    if (request.status !== 'PENDING') throw new BadRequestException('Only pending requests can be rejected');

    return prisma.loanRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { createdBy: { select: { name: true } }, client: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}
