import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { paymentReference } from '../investor-payments/payment-reference';
import { AddCapitalDto } from './dto/add-capital.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { getInvestmentPeriodStatus, investmentBusinessDate } from './investment-period-status';

@Injectable()
export class InvestmentsService {
  async create(investorId: string, dto: CreateInvestmentDto, userId: string) {
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      select: { id: true, code: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');

    const monthlyPayment = this.calculateMonthlyPayment(dto.capital, dto.rate);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const investment = await prisma.$transaction(
          async (tx) => {
            const count = await tx.investorInvestment.count({ where: { investorId } });
            const code = `${investor.code}-${String(count + 1).padStart(2, '0')}`;
            const created = await tx.investorInvestment.create({
              data: {
                investorId,
                code,
                capital: dto.capital,
                monthlyPayment,
                rate: dto.rate,
                startDate: dto.startDate
                  ? new Date(dto.startDate)
                  : investmentBusinessDate(new Date()),
                term: dto.term,
                notes: dto.notes,
                createdById: userId,
              },
              include: this.detailInclude(),
            });
            await tx.auditLog.create({
              data: {
                userId,
                action: 'INVESTMENT_CREATED',
                entityType: 'InvestorInvestment',
                entityId: created.id,
                newValues: {
                  investorId,
                  code: created.code,
                  capital: dto.capital,
                  monthlyPayment,
                  rate: dto.rate,
                },
              },
            });
            return created;
          },
          { isolationLevel: 'Serializable' },
        );
        return this.toInvestmentDetail(investment);
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error.code === 'P2002' || error.code === 'P2034') && attempt < 3) continue;
          if (error.code === 'P2002') {
            throw new ConflictException('No se pudo reservar un código de inversión único');
          }
        }
        throw error;
      }
    }

    throw new ConflictException('No se pudo crear la inversión después de varios intentos');
  }

  async listByInvestor(investorId: string) {
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      select: { id: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');

    const investments = await prisma.investorInvestment.findMany({
      where: { investorId },
      include: {
        movements: true,
        payments: {
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
    await prisma.$transaction(async (tx) => {
      const investment = await tx.investorInvestment.findUnique({ where: { id } });
      if (!investment) throw new NotFoundException('Investment not found');
      if (investment.status !== 'ACTIVE') {
        throw new BadRequestException('Only active investments can receive capital additions');
      }
      if (
        Math.round(Number(investment.monthlyPayment) * 100) !==
        Math.round(
          this.calculateMonthlyPayment(Number(investment.capital), Number(investment.rate)) * 100,
        )
      ) {
        throw new BadRequestException(
          'Esta inversión tiene una mensualidad pactada distinta a la tasa. Registra el aporte en una nueva inversión para conservar su historial.',
        );
      }
      const updatedInvestment = await tx.investorInvestment.update({
        where: { id },
        data: { capital: { increment: dto.amount } },
        select: { capital: true, rate: true },
      });
      const nextCapital = Number(updatedInvestment.capital);
      await tx.investorInvestment.update({
        where: { id },
        data: {
          monthlyPayment: this.calculateMonthlyPayment(nextCapital, Number(updatedInvestment.rate)),
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
            previousCapital: nextCapital - dto.amount,
            nextCapital,
            movementDate: dto.movementDate,
          },
        },
      });
    });

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
    return Math.round(capital * rate) / 100;
  }

  getCurrentPeriodStatus(
    startDate: Date | string | null | undefined,
    payments: Array<{
      periodMonth: number;
      periodYear: number;
      amount?: number | string | { toString(): string };
    }>,
    today = new Date(),
    monthlyPayment?: number | string | { toString(): string },
  ) {
    return getInvestmentPeriodStatus(startDate, payments, today, monthlyPayment);
  }

  private periodStatus(investment: {
    startDate: Date | null;
    createdAt: Date;
    monthlyPayment: Prisma.Decimal;
    rate: Prisma.Decimal;
    capital: Prisma.Decimal;
    payments?: Array<{
      id: string;
      receiptNumber: number;
      periodMonth: number;
      periodYear: number;
      amount: Prisma.Decimal;
    }>;
    movements?: Array<{ amount: Prisma.Decimal; movementDate: Date }>;
  }) {
    return getInvestmentPeriodStatus(
      investment.startDate ??
        (investment.createdAt ? investmentBusinessDate(investment.createdAt) : null),
      investment.payments ?? [],
      new Date(),
      investment.monthlyPayment,
      { rate: investment.rate, capital: investment.capital, movements: investment.movements ?? [] },
    );
  }
  private detailInclude() {
    return {
      investor: true,
      payments: {
        include: { receivedBy: { select: { id: true, name: true } } },
        orderBy: [{ periodYear: 'desc' as const }, { periodMonth: 'desc' as const }],
      },
      movements: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { movementDate: 'desc' as const },
      },
    };
  }

  private toInvestmentDetail(
    investment: Prisma.InvestorInvestmentGetPayload<{
      include: ReturnType<InvestmentsService['detailInclude']>;
    }>,
  ) {
    const periodStatus = this.periodStatus(investment);
    return {
      ...this.toInvestmentSummary(investment),
      investor: investment.investor,
      payments: investment.payments.map((payment) => ({
        ...payment,
        reference: paymentReference(payment.reference),
        allocations: periodStatus.paymentAllocations[payment.id] ?? [],
      })),
      movements: investment.movements,
    };
  }

  private toInvestmentSummary(
    investment:
      | Prisma.InvestorInvestmentGetPayload<{ include: { payments: true } }>
      | Prisma.InvestorInvestmentGetPayload<Record<string, never>>,
  ) {
    const status = this.periodStatus(investment);

    return {
      ...investment,
      ...('payments' in investment
        ? {
            payments: investment.payments.map((payment) => ({
              ...payment,
              reference: paymentReference(payment.reference),
            })),
          }
        : {}),
      capital: Number(investment.capital),
      monthlyPayment: Number(investment.monthlyPayment),
      rate: Number(investment.rate),
      nextDueDate: status.nextDueDate,
      currentPeriodMonth: status.currentPeriodMonth,
      currentPeriodYear: status.currentPeriodYear,
      paymentStatus: status.paymentStatus,
      currentPeriodBalance: status.currentPeriodBalance,
      pendingAmount: status.pendingAmount,
      pendingMonths: status.pendingMonths,
      pendingPeriods: status.pendingPeriods,
      totalPaid: status.totalPaid,
    };
  }
}
