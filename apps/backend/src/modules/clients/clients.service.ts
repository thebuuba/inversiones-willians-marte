import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  async create(dto: CreateClientDto, userId: string) {
    return prisma.client.create({
      data: { ...dto, createdById: userId },
    });
  }

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { identification: { contains: search } },
          ],
        }
      : {};

    return prisma.client.findMany({
      where: { ...where, active: true },
      include: { _count: { select: { loans: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        loans: {
          include: { product: true, _count: { select: { payments: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.client.update({ where: { id }, data: { active: false } });
  }
}
