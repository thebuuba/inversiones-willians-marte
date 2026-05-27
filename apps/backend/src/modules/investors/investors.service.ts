import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateInvestorDto } from './dto/create-investor.dto';

@Injectable()
export class InvestorsService {
  async create(dto: CreateInvestorDto, userId: string) {
    const count = await prisma.investor.count();
    const code = `INV-${String(count + 1).padStart(4, '0')}`;
    return prisma.investor.create({
      data: { ...dto, code, createdById: userId },
    });
  }

  async findAll() {
    return prisma.investor.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) throw new Error('Investor not found');
    return investor;
  }
}
