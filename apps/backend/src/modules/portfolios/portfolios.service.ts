import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';

@Injectable()
export class PortfoliosService {
  async create(dto: CreatePortfolioDto, userId: string) {
    return prisma.portfolio.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? '#5FA37D',
        createdById: userId,
      },
    });
  }

  async findAll() {
    return prisma.portfolio.findMany({
      include: { _count: { select: { loans: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: { _count: { select: { loans: true } } },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async remove(id: string) {
    await this.findOne(id);
    await prisma.portfolio.delete({ where: { id } });
  }
}
