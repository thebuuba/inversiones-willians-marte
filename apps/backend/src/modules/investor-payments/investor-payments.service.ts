import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, prisma } from '@inversiones/database';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';
import { InvestmentsService } from '../investments/investments.service';

type InvestorPaymentWithReceiver = Prisma.InvestorPaymentGetPayload<{
  include: { receivedBy: { select: { id: true; name: true } } };
}>;

@Injectable()
export class InvestorPaymentsService {
  constructor(private investments: InvestmentsService) {}

  async create(
    dto: CreateInvestorPaymentDto,
    userId: string,
  ): Promise<InvestorPaymentWithReceiver> {
    const investment = await this.resolveInvestment(dto.investmentId, dto.investorId);
    return this.createWithRetry(dto, userId, investment, 1);
  }

  private async createWithRetry(
    dto: CreateInvestorPaymentDto,
    userId: string,
    investment: { id: string; investorId: string },
    attempt: number,
  ): Promise<InvestorPaymentWithReceiver> {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const lastReceipt = await tx.investorPayment.findFirst({
            orderBy: { receiptNumber: 'desc' },
            select: { receiptNumber: true },
          });
          const receiptNumber = (lastReceipt?.receiptNumber ?? 0) + 1;
          const payment = await tx.investorPayment.create({
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
          await tx.auditLog.create({
            data: {
              userId,
              action: 'INVESTOR_PAYMENT_CREATED',
              entityType: 'InvestorPayment',
              entityId: payment.id,
              newValues: {
                investorId: investment.investorId,
                investmentId: investment.id,
                amount: dto.amount,
                periodMonth: dto.periodMonth,
                periodYear: dto.periodYear,
                receiptNumber,
              },
            },
          });
          return payment;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if ((error.code === 'P2002' || error.code === 'P2034') && attempt < 3) {
          return this.createWithRetry(dto, userId, investment, attempt + 1);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('No se pudo reservar un número de recibo único');
        }
      }
      throw error;
    }
  }

  async findByInvestor(investorId: string) {
    return prisma.investorPayment.findMany({
      where: { investorId },
      include: { receivedBy: { select: { id: true, name: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      take: 500,
    });
  }

  async findByInvestment(investmentId: string) {
    return prisma.investorPayment.findMany({
      where: { investmentId },
      include: { receivedBy: { select: { id: true, name: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      take: 500,
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
