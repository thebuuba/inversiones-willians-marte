import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateLoanProductDto } from './dto/create-loan-product.dto';
import { UpdateLoanProductDto } from './dto/update-loan-product.dto';

@Injectable()
export class LoanProductsService {
  async create(dto: CreateLoanProductDto) {
    return prisma.loanProduct.create({
      data: {
        name: dto.name,
        interestType: dto.interestType,
        interestRate: dto.interestRate,
        interestFrequency: dto.interestFrequency,
        paymentFrequency: dto.paymentFrequency,
        maxAmount: dto.maxAmount,
        minAmount: dto.minAmount,
        maxTerm: dto.maxTerm,
        latePenaltyType: dto.latePenaltyType,
        latePenaltyValue: dto.latePenaltyValue,
      },
    });
  }

  async findAll() {
    return prisma.loanProduct.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await prisma.loanProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Loan product not found');
    return product;
  }

  async update(id: string, dto: UpdateLoanProductDto) {
    await this.findOne(id);
    return prisma.loanProduct.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.loanProduct.update({ where: { id }, data: { active: false } });
  }
}
