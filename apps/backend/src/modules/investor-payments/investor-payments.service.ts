import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';

@Injectable()
export class InvestorPaymentsService {
  async create(dto: CreateInvestorPaymentDto, userId: string) {
    const investor = await prisma.investor.findUnique({ where: { id: dto.investorId } });
    if (!investor) throw new NotFoundException('Investor not found');

    const lastReceipt = await prisma.investorPayment.findFirst({
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true },
    });
    const receiptNumber = (lastReceipt?.receiptNumber ?? 0) + 1;

    try {
      return await prisma.investorPayment.create({
        data: {
          investorId: dto.investorId,
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
        throw new BadRequestException('This period is already paid for this investor');
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

  async checkPeriod(investorId: string, periodMonth: number, periodYear: number) {
    return prisma.investorPayment.findFirst({
      where: { investorId, periodMonth, periodYear },
    });
  }
}
