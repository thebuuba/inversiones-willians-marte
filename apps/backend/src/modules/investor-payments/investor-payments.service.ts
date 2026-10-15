import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, prisma } from '@inversiones/database';
import { paymentReference } from './payment-reference';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';
import { InvestmentsService } from '../investments/investments.service';
import {
  getInvestmentPeriodStatus,
  investmentBusinessDate,
  type InterestAllocation,
} from '../investments/investment-period-status';

type InvestorPaymentWithReceiver = Prisma.InvestorPaymentGetPayload<{
  include: { receivedBy: { select: { id: true; name: true } } };
}>;
type PaymentResult = InvestorPaymentWithReceiver & { allocations: InterestAllocation[] };

@Injectable()
export class InvestorPaymentsService {
  constructor(private investments: InvestmentsService) {}

  async create(dto: CreateInvestorPaymentDto, userId: string): Promise<PaymentResult> {
    const resolved = await this.resolveInvestment(dto.investmentId, dto.investorId);
    if (dto.investorId && dto.investorId !== resolved.investorId)
      throw new BadRequestException('La inversión no pertenece al inversionista indicado');
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await prisma.$transaction(
          async (tx) => {
            const investment = await tx.investorInvestment.findUnique({
              where: { id: resolved.id },
              include: { payments: true, movements: true },
            });
            if (!investment) throw new NotFoundException('Inversión no encontrada');
            const ledger = (payments = investment.payments) =>
              getInvestmentPeriodStatus(
                investment.startDate ??
                  (investment.createdAt ? investmentBusinessDate(investment.createdAt) : null),
                payments,
                new Date(),
                investment.monthlyPayment,
                {
                  rate: investment.rate,
                  capital: investment.capital,
                  movements: investment.movements,
                },
              );
            const reference = dto.requestId
              ? `request:${dto.requestId}|${dto.reference ?? ''}`
              : dto.reference;
            if (dto.requestId) {
              const existing = await tx.investorPayment.findFirst({
                where: {
                  investmentId: investment.id,
                  reference: { startsWith: `request:${dto.requestId}` },
                },
                include: { receivedBy: { select: { id: true, name: true } } },
              });
              if (existing) {
                if (
                  Number(existing.amount) !== dto.amount ||
                  existing.periodMonth !== dto.periodMonth ||
                  existing.periodYear !== dto.periodYear ||
                  existing.paymentDate.getTime() !== new Date(dto.paymentDate).getTime()
                ) {
                  throw new ConflictException('Esta solicitud ya fue registrada con otros datos');
                }
                return {
                  ...existing,
                  reference: paymentReference(existing.reference),
                  allocations: ledger().paymentAllocations[existing.id] ?? [],
                };
              }
            }
            if (investment.status !== 'ACTIVE')
              throw new BadRequestException('Solo las inversiones activas pueden recibir pagos');
            const before = ledger();
            if (
              dto.periodMonth !== before.currentPeriodMonth ||
              dto.periodYear !== before.currentPeriodYear
            )
              throw new BadRequestException(
                'El período cambió. Actualiza la inversión antes de pagar',
              );
            if (
              !Number.isFinite(dto.amount) ||
              dto.amount <= 0 ||
              Math.round(dto.amount * 100) > Math.round(before.pendingAmount * 100)
            ) {
              throw new BadRequestException(
                'El monto debe ser mayor que cero y no superar el interés pendiente',
              );
            }
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
                periodMonth: before.currentPeriodMonth,
                periodYear: before.currentPeriodYear,
                paymentDate: new Date(dto.paymentDate),
                paymentMethod: dto.paymentMethod,
                reference,
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
                  periodMonth: before.currentPeriodMonth,
                  periodYear: before.currentPeriodYear,
                  receiptNumber,
                },
              },
            });
            return {
              ...payment,
              reference: paymentReference(payment.reference),
              allocations:
                ledger([...investment.payments, payment]).paymentAllocations[payment.id] ?? [],
            };
          },
          { isolationLevel: 'Serializable' },
        );
      } catch (error: unknown) {
        if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException ||
          error instanceof ConflictException
        )
          throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if ((error.code === 'P2002' || error.code === 'P2034') && attempt < 3) continue;
          if (error.code === 'P2002' || error.code === 'P2034')
            throw new ConflictException(
              'No se pudo registrar el pago concurrente. Actualiza e intenta de nuevo',
            );
        }
        throw error;
      }
    }
    throw new ConflictException('No se pudo registrar el pago');
  }

  async findByInvestor(investorId: string) {
    const payments = await prisma.investorPayment.findMany({
      where: { investorId },
      include: { receivedBy: { select: { id: true, name: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { receiptNumber: 'desc' }],
    });
    const ids = [
      ...new Set(
        payments.map((payment) => payment.investmentId).filter((id): id is string => !!id),
      ),
    ];
    const details = await Promise.all(ids.map((id) => this.investments.findOne(id)));
    const allocations = new Map(
      details.flatMap((detail) =>
        detail.payments.map((payment) => [payment.id, payment.allocations] as const),
      ),
    );
    return payments.map((payment) => ({
      ...payment,
      reference: paymentReference(payment.reference),
      allocations: allocations.get(payment.id) ?? [],
    }));
  }

  async findByInvestment(investmentId: string) {
    const detail = await this.investments.findOne(investmentId);
    return detail.payments;
  }

  async checkPeriod(
    periodMonth: number,
    periodYear: number,
    investmentId?: string,
    investorId?: string,
  ) {
    const investment = await this.resolveInvestment(investmentId, investorId);
    const detail = await this.investments.findOne(investment.id);
    if (
      detail.pendingPeriods.some(
        (period) =>
          period.periodMonth === periodMonth &&
          period.periodYear === periodYear &&
          period.balance > 0,
      )
    )
      return null;
    // A receipt for a partial payment does not mean the month is fully settled.
    if (detail.currentPeriodMonth === periodMonth && detail.currentPeriodYear === periodYear)
      return null;
    return (
      detail.payments.find((payment) =>
        payment.allocations.some(
          (allocation) =>
            allocation.periodMonth === periodMonth && allocation.periodYear === periodYear,
        ),
      ) ?? null
    );
  }

  private async resolveInvestment(investmentId?: string, investorId?: string) {
    if (investmentId) {
      const investment = await prisma.investorInvestment.findUnique({
        where: { id: investmentId },
      });
      if (!investment) throw new NotFoundException('Inversión no encontrada');
      return investment;
    }
    if (investorId) return this.investments.resolveSingleActiveInvestment(investorId);
    throw new BadRequestException('Selecciona una inversión');
  }
}
