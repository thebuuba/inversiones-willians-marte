import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateInvestorDto } from './dto/create-investor.dto';

@Injectable()
export class InvestorsService {
  async create(dto: CreateInvestorDto, userId: string) {
    const count = await prisma.investor.count();
    const code = `INV-${String(count + 1).padStart(4, '0')}`;
    return prisma.investor.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        phone2: dto.phone2,
        cedula: dto.cedula,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        nationality: dto.nationality,
        type: dto.type ?? 'individual',
        photo: dto.photo,
        capital: dto.capital,
        monthlyPayment: dto.monthlyPayment,
        rate: dto.rate,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        term: dto.term,
        bank: dto.bank,
        notes: dto.notes,
        code,
        createdById: userId,
      },
    });
  }

  async findAll() {
    return prisma.investor.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) throw new NotFoundException('Investor not found');
    return investor;
  }
}
