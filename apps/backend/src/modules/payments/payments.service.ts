import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { centsToDecimal, moneyToCents } from '../../common/money';
import { addPaymentInterval, calculateIndefiniteInterest } from '../loans/indefinite-loan';
import type { PaymentFrequency } from '@inversiones/shared';
import { syncLoanLateFees } from '../loans/late-fee';
import { assertLoanAccess, type PortfolioScope } from '../../common/portfolio-scope';

@Injectable()
export class PaymentsService {
  async create(scope: PortfolioScope, dto: CreatePaymentDto, userId: string) {
    await assertLoanAccess(scope, dto.loanId);
    await syncLoanLateFees(dto.loanId, new Date(dto.paymentDate));
    return prisma.$transaction(
      async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id: dto.loanId },
          include: {
            schedule: {
              orderBy: { dueDate: 'asc' },
              include: {
                paymentAllocs: { select: { amount: true, type: true } },
                lateFees: true,
              },
            },
          },
        });
        if (!loan) throw new NotFoundException('Loan not found');
        if (!['ACTIVE', 'OVERDUE'].includes(loan.status)) {
          throw new BadRequestException('Loan is not open for payments');
        }
        if (loan.clientId !== dto.clientId) {
          throw new BadRequestException('Payment client does not match the loan client');
        }

        const schedules = [...loan.schedule];
        if (
          loan.interestType === 'INDEFINITE' &&
          !schedules.some((schedule) => this.isCollectible(schedule.status))
        ) {
          const nextSchedule = await this.createNextIndefiniteScheduleTx(tx, {
            loanId: loan.id,
            principal: Number(loan.principal),
            interestRate: Number(loan.interestRate),
            paymentFrequency: loan.paymentFreq,
            startDate: loan.startDate,
            schedules,
          });
          schedules.push({ ...nextSchedule, paymentAllocs: [], lateFees: [] });
        }

        const paymentAmountCents = moneyToCents(dto.amount);
        let allocatedCents = 0;
        const allocations: {
          scheduleId: string;
          amountCents: number;
          type: 'PRINCIPAL' | 'INTEREST' | 'PENALTY';
        }[] = [];

        const pendingSchedules = schedules.filter((schedule) =>
          this.isCollectible(schedule.status),
        );

        for (const schedule of pendingSchedules) {
          if (allocatedCents >= paymentAmountCents) break;

          const owedCents = moneyToCents(schedule.amount) - moneyToCents(schedule.paidAmount ?? 0);
          if (owedCents > 0) {
            const toAllocateCents = Math.min(owedCents, paymentAmountCents - allocatedCents);
            const interestPaidCents = schedule.paymentAllocs
              .filter((allocation) => allocation.type === 'INTEREST')
              .reduce((sum, allocation) => sum + moneyToCents(allocation.amount), 0);
            const remainingInterestCents = Math.max(
              0,
              moneyToCents(schedule.interestPart) - interestPaidCents,
            );
            const interestAllocationCents = Math.min(toAllocateCents, remainingInterestCents);

            if (interestAllocationCents > 0) {
              allocations.push({
                scheduleId: schedule.id,
                amountCents: interestAllocationCents,
                type: 'INTEREST',
              });
              allocatedCents += interestAllocationCents;
            }

            const principalAllocationCents = toAllocateCents - interestAllocationCents;
            if (principalAllocationCents > 0) {
              allocations.push({
                scheduleId: schedule.id,
                amountCents: principalAllocationCents,
                type: 'PRINCIPAL',
              });
              allocatedCents += principalAllocationCents;
            }
          }

          const lateFee = schedule.lateFees?.find((fee) => !fee.paid);
          if (lateFee && allocatedCents < paymentAmountCents) {
            const remainingFeeCents = Math.max(
              0,
              moneyToCents(lateFee.amount) - moneyToCents(lateFee.paidAmount),
            );
            const penaltyCents = Math.min(remainingFeeCents, paymentAmountCents - allocatedCents);
            if (penaltyCents > 0) {
              allocations.push({
                scheduleId: schedule.id,
                amountCents: penaltyCents,
                type: 'PENALTY',
              });
              allocatedCents += penaltyCents;
            }
          }
        }

        if (allocatedCents !== paymentAmountCents) {
          throw new BadRequestException('Payment exceeds the outstanding scheduled balance');
        }

        const p = await tx.payment.create({
          data: {
            loanId: dto.loanId,
            clientId: dto.clientId,
            amount: dto.amount,
            paymentDate: new Date(dto.paymentDate),
            paymentMethod: dto.paymentMethod,
            reference: dto.reference,
            notes: dto.notes,
            receivedById: userId,
            allocations: {
              create: allocations.map(({ scheduleId, amountCents, type }) => ({
                scheduleId,
                amount: centsToDecimal(amountCents),
                type,
              })),
            },
          },
          include: { allocations: true },
        });

        const paidBySchedule = new Map<string, number>();
        for (const alloc of allocations.filter((item) => item.type !== 'PENALTY')) {
          paidBySchedule.set(
            alloc.scheduleId,
            (paidBySchedule.get(alloc.scheduleId) ?? 0) + alloc.amountCents,
          );
        }

        const penaltiesBySchedule = new Map<string, number>();
        for (const allocation of allocations.filter((item) => item.type === 'PENALTY')) {
          penaltiesBySchedule.set(
            allocation.scheduleId,
            (penaltiesBySchedule.get(allocation.scheduleId) ?? 0) + allocation.amountCents,
          );
        }
        for (const [scheduleId, amountCents] of penaltiesBySchedule) {
          const fee = schedules
            .find((schedule) => schedule.id === scheduleId)
            ?.lateFees?.find((item) => !item.paid);
          if (!fee) continue;
          const totalPaidCents = moneyToCents(fee.paidAmount) + amountCents;
          await tx.lateFee.update({
            where: { scheduleId },
            data: {
              paidAmount: centsToDecimal(totalPaidCents),
              paid: totalPaidCents >= moneyToCents(fee.amount),
            },
          });
        }

        for (const [scheduleId, amountCents] of paidBySchedule) {
          const schedule = schedules.find((s) => s.id === scheduleId);
          if (!schedule) continue;
          const totalPaidCents = moneyToCents(schedule.paidAmount ?? 0) + amountCents;
          const isFull = totalPaidCents >= moneyToCents(schedule.amount);

          await tx.paymentSchedule.update({
            where: { id: scheduleId },
            data: {
              status: isFull ? 'PAID' : 'PARTIAL',
              paidDate: isFull ? new Date(dto.paymentDate) : undefined,
              paidAmount: centsToDecimal(totalPaidCents),
            },
          });
        }

        if (loan.interestType === 'INDEFINITE') {
          const hasOutstandingSchedule = pendingSchedules.some((schedule) => {
            const paidInThisPayment = paidBySchedule.get(schedule.id) ?? 0;
            const projectedPaid = moneyToCents(schedule.paidAmount ?? 0) + paidInThisPayment;
            return projectedPaid < moneyToCents(schedule.amount);
          });

          if (!hasOutstandingSchedule) {
            await this.createNextIndefiniteScheduleTx(tx, {
              loanId: loan.id,
              principal: Number(loan.principal),
              interestRate: Number(loan.interestRate),
              paymentFrequency: loan.paymentFreq,
              startDate: loan.startDate,
              schedules,
            });
          }
        }

        await this.updateLoanBalanceTx(tx, loan.id, userId, dto.clientId);
        await this.reconcilePaymentPromisesTx(tx, loan.id, dto.amount, userId, dto.clientId);

        await tx.auditLog.create({
          data: {
            userId,
            action: 'PAYMENT_CREATED',
            entityType: 'Payment',
            entityId: p.id,
            clientId: dto.clientId,
            newValues: {
              loanId: dto.loanId,
              amount: dto.amount,
              paymentDate: dto.paymentDate,
              paymentMethod: dto.paymentMethod ?? null,
              reference: dto.reference ?? null,
            },
          },
        });

        return p;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findByLoan(scope: PortfolioScope, loanId: string) {
    await assertLoanAccess(scope, loanId);
    return prisma.payment.findMany({
      where: { loanId },
      include: {
        receivedBy: { select: { id: true, name: true } },
        allocations: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  private isCollectible(status: string): boolean {
    return status === 'PENDING' || status === 'PARTIAL' || status === 'OVERDUE';
  }

  private async createNextIndefiniteScheduleTx(
    tx: Prisma.TransactionClient,
    params: {
      loanId: string;
      principal: number;
      interestRate: number;
      paymentFrequency: PaymentFrequency;
      startDate: Date;
      schedules: Array<{ dueDate: Date }>;
    },
  ) {
    const lastDueDate = params.schedules.reduce<Date | null>(
      (latest, schedule) =>
        latest == null || schedule.dueDate > latest ? schedule.dueDate : latest,
      null,
    );
    const dueDate = addPaymentInterval(lastDueDate ?? params.startDate, params.paymentFrequency);
    const amount = calculateIndefiniteInterest(
      params.principal,
      params.interestRate,
      params.paymentFrequency,
    );

    const schedule = await tx.paymentSchedule.upsert({
      where: { loanId_dueDate: { loanId: params.loanId, dueDate } },
      update: {},
      create: {
        loanId: params.loanId,
        dueDate,
        amount,
        principalPart: 0,
        interestPart: amount,
        balanceAfter: params.principal,
      },
    });
    await tx.loan.update({
      where: { id: params.loanId },
      data: { totalAmount: amount },
    });
    return schedule;
  }

  private async updateLoanBalanceTx(
    tx: Prisma.TransactionClient,
    loanId: string,
    userId: string,
    clientId: number,
  ) {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { schedule: true },
    });
    if (!loan) return;

    const totalPaidCents = loan.schedule.reduce(
      (sum, schedule) => sum + moneyToCents(schedule.paidAmount ?? 0),
      0,
    );
    const allPaid = loan.schedule.every((s) => s.status === 'PAID');
    const isIndefinite = loan.interestType === 'INDEFINITE';
    const newBalanceCents = isIndefinite
      ? moneyToCents(loan.principal)
      : Math.max(0, moneyToCents(loan.totalAmount) - totalPaidCents);

    const nextStatus = !isIndefinite && allPaid ? 'PAID' : loan.status;
    await tx.loan.update({
      where: { id: loanId },
      data: {
        balance: centsToDecimal(newBalanceCents),
        status: nextStatus,
      },
    });

    if (loan.status !== nextStatus) {
      await tx.auditLog.create({
        data: {
          userId,
          action: 'LOAN_STATUS_CHANGED',
          entityType: 'Loan',
          entityId: loanId,
          clientId,
          oldValues: { status: loan.status },
          newValues: { status: nextStatus, balance: newBalanceCents / 100 },
        },
      });
    }
  }

  private async reconcilePaymentPromisesTx(
    tx: Prisma.TransactionClient,
    loanId: string,
    paymentAmount: number,
    userId: string,
    clientId: number,
  ) {
    const promises = await tx.paymentPromise.findMany({
      where: { loanId, status: { in: ['PENDING', 'PARTIAL', 'BROKEN'] } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });

    let remainingPaymentCents = moneyToCents(paymentAmount);
    for (const promise of promises) {
      if (remainingPaymentCents <= 0) break;
      const promisedAmountCents = moneyToCents(promise.amount);
      const currentFulfilledCents = moneyToCents(promise.fulfilledAmount);
      const outstandingCents = Math.max(0, promisedAmountCents - currentFulfilledCents);
      if (outstandingCents === 0) continue;

      const appliedCents = Math.min(outstandingCents, remainingPaymentCents);
      const fulfilledAmountCents = currentFulfilledCents + appliedCents;
      const fulfilled = fulfilledAmountCents >= promisedAmountCents;
      const status = fulfilled ? 'FULFILLED' : promise.status === 'BROKEN' ? 'BROKEN' : 'PARTIAL';

      await tx.paymentPromise.update({
        where: { id: promise.id },
        data: { fulfilledAmount: centsToDecimal(fulfilledAmountCents), status },
      });
      if (fulfilled) {
        await tx.task.updateMany({
          where: { collectionInteractionId: promise.interactionId, status: { not: 'COMPLETED' } },
          data: { status: 'COMPLETED' },
        });
      }
      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_PROMISE_UPDATED',
          entityType: 'PaymentPromise',
          entityId: promise.id,
          clientId,
          oldValues: {
            fulfilledAmount: currentFulfilledCents / 100,
            status: promise.status,
          },
          newValues: {
            fulfilledAmount: fulfilledAmountCents / 100,
            status,
            paymentApplied: appliedCents / 100,
          },
        },
      });
      remainingPaymentCents -= appliedCents;
    }
  }
}
