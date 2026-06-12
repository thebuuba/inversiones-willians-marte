import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';
import { InvestmentsService } from '../investments/investments.service';

@Injectable()
export class InvestorPaymentsService {
  constructor(private investments: InvestmentsService) {}

  async create(dto: CreateInvestorPaymentDto, userId: string) {
    const investment = await this.resolveInvestment(dto.investmentId, dto.investorId);

    const lastReceipt = await prisma.investorPayment.findFirst({
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true },
    });
    const receiptNumber = (lastReceipt?.receiptNumber ?? 0) + 1;

    try {
      return await prisma.investorPayment.create({
        data: {
          investorId: investment.investorId,
          investmentId: investment.id,
          receiptNumber,
          amount: dto.amount,
          periodMonth: dto.periodMonth,
          periodYear: dto.periodYear,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          notes: dto.notes,
          receivedById: userId,
        },
        include: { receivedBy: { select: { id: true, name: true } } },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new BadRequestException('Unable to create investor payment due to duplicate data');
      }
      throw error;
    }
  }

  async findByInvestor(investorId: string) {
    return prisma.investorPayment.findMany({
      where: { investorId },
      include: { receivedBy: { select: { id: true, name: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  async findByInvestment(investmentId: string) {
    return prisma.investorPayment.findMany({
      where: { investmentId },
      include: { receivedBy: { select: { id: true, name: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  async checkPeriod(
    periodMonth: number,
    periodYear: number,
    investmentId?: string,
    investorId?: string,
  ) {
    const investment = await this.resolveInvestment(investmentId, investorId);
    return prisma.investorPayment.findFirst({
      where: { investmentId: investment.id, periodMonth, periodYear },
    });
  }

  private async resolveInvestment(investmentId?: string, investorId?: string) {
    if (investmentId) {
      const investment = await prisma.investorInvestment.findUnique({
        where: { id: investmentId },
      });
      if (!investment) throw new NotFoundException('Investment not found');
      return investment;
    }
    if (investorId) return this.investments.resolveSingleActiveInvestment(investorId);
    throw new BadRequestException('Investment id is required');
  }
}
