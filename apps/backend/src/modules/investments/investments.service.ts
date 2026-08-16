import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const monthlyPayment =
      dto.monthlyPayment ?? this.calculateMonthlyPayment(dto.capital, dto.rate);

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
                startDate: dto.startDate ? new Date(dto.startDate) : null,
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
        payments: {
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
          take: 200,
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
    return capital * (rate / 100);
  }

  getCurrentPeriodStatus(
    startDate: Date | string | null | undefined,
    payments: Array<{ periodMonth: number; periodYear: number; amount?: number | string }>,
    today = new Date(),
    monthlyPayment?: number | string,
  ) {
    return getInvestmentPeriodStatus(startDate, payments, today, monthlyPayment);
  }

  private detailInclude() {
    return {
      investor: true,
      payments: {
        orderBy: [{ periodYear: 'desc' as const }, { periodMonth: 'desc' as const }],
        take: 500,
      },
      movements: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { movementDate: 'desc' as const },
        take: 500,
      },
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
    const status = this.getCurrentPeriodStatus(
      investment.startDate,
      payments,
      new Date(),
      investment.monthlyPayment,
    );
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
