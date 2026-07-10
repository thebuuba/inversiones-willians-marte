import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { AddCapitalDto } from './dto/add-capital.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { getInvestmentPeriodStatus } from './investment-period-status';

@Injectable()
export class InvestmentsService {
  async create(investorId: string, dto: CreateInvestmentDto, userId: string) {
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      select: { id: true, code: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');

    const code = await this.nextInvestmentCode(investor.id, investor.code);
    const monthlyPayment =
      dto.monthlyPayment ?? this.calculateMonthlyPayment(dto.capital, dto.rate);

    const investment = await prisma.investorInvestment.create({
      data: {
        investorId,
        code,
        capital: dto.capital,
        monthlyPayment,
        rate: dto.rate,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        term: dto.term,
        notes: dto.notes,
        createdById: userId,
      },
      include: this.detailInclude(),
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INVESTMENT_CREATED',
        entityType: 'InvestorInvestment',
        entityId: investment.id,
        newValues: {
          investorId,
          code: investment.code,
          capital: dto.capital,
          monthlyPayment,
          rate: dto.rate,
        },
      },
    });

    return this.toInvestmentDetail(investment);
  }

  async listByInvestor(investorId: string) {
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      select: { id: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');

    const investments = await prisma.investorInvestment.findMany({
      where: { investorId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });

    return investments.map((investment) => this.toInvestmentSummary(investment));
  }

  async findOne(id: string) {
    const investment = await prisma.investorInvestment.findUnique({
      where: { id },
      include: this.detailInclude(),
    });
    if (!investment) throw new NotFoundException('Investment not found');
    return this.toInvestmentDetail(investment);
  }

  async addCapital(id: string, dto: AddCapitalDto, userId: string) {
    await prisma.$transaction(
      async (tx) => {
        const investment = await tx.investorInvestment.findUnique({ where: { id } });
        if (!investment) throw new NotFoundException('Investment not found');
        if (investment.status !== 'ACTIVE') {
          throw new BadRequestException('Only active investments can receive capital additions');
        }
        const nextCapital = Number(investment.capital) + dto.amount;
        await tx.investorInvestment.update({
          where: { id },
          data: {
            capital: nextCapital,
            monthlyPayment: this.calculateMonthlyPayment(nextCapital, Number(investment.rate)),
          },
        });
        const movement = await tx.investorInvestmentMovement.create({
          data: {
            investmentId: id,
            type: 'CAPITAL_ADDITION',
            amount: dto.amount,
            movementDate: new Date(dto.movementDate),
            notes: dto.notes,
            createdById: userId,
          },
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'INVESTMENT_CAPITAL_ADDED',
            entityType: 'InvestorInvestmentMovement',
            entityId: movement.id,
            newValues: {
              investmentId: id,
              amount: dto.amount,
              previousCapital: Number(investment.capital),
              nextCapital,
              movementDate: dto.movementDate,
            },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return this.findOne(id);
  }

  async resolveSingleActiveInvestment(investorId: string) {
    const investments = await prisma.investorInvestment.findMany({
      where: { investorId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    if (investments.length === 0) throw new NotFoundException('Investment not found');
    if (investments.length > 1) {
      throw new BadRequestException(
        'Investment id is required for investors with multiple active investments',
      );
    }
    return investments[0];
  }

  calculateMonthlyPayment(capital: number, rate: number) {
    if (!Number.isFinite(capital) || !Number.isFinite(rate) || capital <= 0 || rate <= 0) return 0;
    return capital * (rate / 100);
  }

  getCurrentPeriodStatus(
    startDate: Date | string | null | undefined,
    payments: Array<{ periodMonth: number; periodYear: number }>,
    today = new Date(),
  ) {
    return getInvestmentPeriodStatus(startDate, payments, today);
  }

  private async nextInvestmentCode(investorId: string, investorCode: string) {
    const count = await prisma.investorInvestment.count({ where: { investorId } });
    return `${investorCode}-${String(count + 1).padStart(2, '0')}`;
  }

  private detailInclude() {
    return {
      investor: true,
      payments: { orderBy: [{ periodYear: 'desc' as const }, { periodMonth: 'desc' as const }] },
      movements: { orderBy: { movementDate: 'desc' as const } },
    };
  }

  private toInvestmentDetail(
    investment: Prisma.InvestorInvestmentGetPayload<{
      include: ReturnType<InvestmentsService['detailInclude']>;
    }>,
  ) {
    return {
      ...this.toInvestmentSummary(investment),
      investor: investment.investor,
      payments: investment.payments,
      movements: investment.movements,
    };
  }

  private toInvestmentSummary(
    investment:
      | Prisma.InvestorInvestmentGetPayload<{ include: { payments: true } }>
      | Prisma.InvestorInvestmentGetPayload<Record<string, never>>,
  ) {
    const payments = 'payments' in investment ? investment.payments : [];
    const status = this.getCurrentPeriodStatus(investment.startDate, payments);
    return {
      ...investment,
      capital: Number(investment.capital),
      monthlyPayment: Number(investment.monthlyPayment),
      rate: Number(investment.rate),
      nextDueDate: status.nextDueDate,
      currentPeriodMonth: status.currentPeriodMonth,
      currentPeriodYear: status.currentPeriodYear,
      paymentStatus: status.paymentStatus,
    };
  }
}
