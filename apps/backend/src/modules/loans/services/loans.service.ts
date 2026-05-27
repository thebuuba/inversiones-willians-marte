import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { AmortizationService } from './amortization.service';

@Injectable()
export class LoansService {
  constructor(private amortization: AmortizationService) {}

  async create(dto: CreateLoanDto, userId: string) {
    const product = await prisma.loanProduct.findUnique({ where: { id: dto.productId } });
    if (!product || !product.active) throw new NotFoundException('Loan product not found');

    const client = await prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client || !client.active) throw new NotFoundException('Client not found');

    if (dto.term > (product.maxTerm ?? Infinity)) {
      throw new BadRequestException(`Term exceeds maximum of ${product.maxTerm}`);
    }

    const schedule = this.amortization.calculate({
      principal: dto.principal,
      interestRate: Number(product.interestRate),
      interestType: product.interestType,
      paymentFrequency: product.paymentFrequency,
      term: dto.term,
      startDate: new Date(dto.startDate),
    });

    const totalAmount = schedule.reduce((sum, row) => sum + row.amount, 0);
    const lastRow = schedule[schedule.length - 1];

    const loan = await prisma.loan.create({
      data: {
        clientId: dto.clientId,
        productId: dto.productId,
        principal: dto.principal,
        interestRate: product.interestRate,
        interestType: product.interestType,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paymentFreq: product.paymentFrequency,
        term: dto.term,
        startDate: new Date(dto.startDate),
        endDate: lastRow?.dueDate ?? null,
        balance: Math.round(totalAmount * 100) / 100,
        notes: dto.notes,
        createdById: userId,
        schedule: {
          create: schedule.map((row) => ({
            dueDate: row.dueDate,
            amount: row.amount,
            principalPart: row.principalPart,
            interestPart: row.interestPart,
            balanceAfter: row.balanceAfter,
          })),
        },
      },
      include: {
        client: true,
        product: true,
        schedule: { orderBy: { dueDate: 'asc' } },
      },
    });

    return loan;
  }

  async findAll(status?: string, search?: string) {
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.client = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { identification: { contains: search } },
        ],
      };
    }

    return prisma.loan.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true, identification: true } },
        product: { select: { id: true, name: true } },
        _count: { select: { payments: true, schedule: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        client: true,
        product: true,
        createdBy: { select: { id: true, name: true } },
        schedule: { orderBy: { dueDate: 'asc' } },
        payments: {
          include: { receivedBy: { select: { id: true, name: true } } },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  async getSummary(id: string) {
    const loan = await this.findOne(id);

    const totalPaid = loan.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paidInstallments = loan.schedule.filter((s) => s.status === 'PAID').length;
    const overdueInstallments = loan.schedule.filter(
      (s) => s.status === 'OVERDUE' || (s.status === 'PENDING' && s.dueDate < new Date()),
    ).length;

    return {
      loanId: loan.id,
      totalAmount: Number(loan.totalAmount),
      balance: Number(loan.balance),
      totalPaid,
      remaining: Number(loan.balance) - totalPaid,
      paidInstallments,
      totalInstallments: loan.schedule.length,
      overdueInstallments,
      progress: Math.round((totalPaid / Number(loan.totalAmount)) * 100),
    };
  }
}
