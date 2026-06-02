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

  async findAll(search?: string, take = 50, skip = 0) {
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

    const fullWhere = { ...where, active: true };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where: fullWhere,
        include: { _count: { select: { loans: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.client.count({ where: fullWhere }),
    ]);

    return { data, total };
  }

  async findBasic(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identification: true,
        phone: true,
        active: true,
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async findOne(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            product: true,
            portfolio: { select: { id: true, name: true } },
            schedule: {
              select: { dueDate: true, status: true, amount: true, paidAmount: true },
              orderBy: { dueDate: 'asc' },
            },
            _count: { select: { payments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: number, dto: UpdateClientDto) {
    await this.findOne(id);
    return prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.client.update({ where: { id }, data: { active: false } });
  }
}
