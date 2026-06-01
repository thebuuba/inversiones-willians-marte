import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  async create(dto: CreatePaymentDto, userId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: dto.loanId },
      include: { schedule: { orderBy: { dueDate: 'asc' } } },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status === 'PAID') throw new BadRequestException('Loan is already paid');

    let allocatedAmount = 0;
    const allocations: { scheduleId: string; amount: number; type: 'PRINCIPAL' | 'INTEREST' | 'PENALTY' }[] = [];

    const pendingSchedules = loan.schedule.filter(
      (s) => s.status === 'PENDING' || s.status === 'PARTIAL' || s.status === 'OVERDUE',
    );

    for (const schedule of pendingSchedules) {
      if (allocatedAmount >= dto.amount) break;

      const owed = Number(schedule.amount) - Number(schedule.paidAmount ?? 0);
      if (owed <= 0) continue;

      const toAllocate = Math.min(owed, dto.amount - allocatedAmount);

      if (toAllocate >= Number(schedule.interestPart)) {
        allocations.push({
          scheduleId: schedule.id,
          amount: Number(schedule.interestPart),
          type: 'INTEREST',
        });
        allocatedAmount += Number(schedule.interestPart);

        const principalAlloc = toAllocate - Number(schedule.interestPart);
        if (principalAlloc > 0) {
          allocations.push({
            scheduleId: schedule.id,
            amount: principalAlloc,
            type: 'PRINCIPAL',
          });
          allocatedAmount += principalAlloc;
        }
      } else {
        allocations.push({
          scheduleId: schedule.id,
          amount: toAllocate,
          type: 'INTEREST',
        });
        allocatedAmount += toAllocate;
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
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
            create: allocations,
          },
        },
        include: { allocations: true },
      });

      for (const alloc of allocations) {
        const schedule = loan.schedule.find((s) => s.id === alloc.scheduleId);
        if (!schedule) continue;
        const totalPaid = Number(schedule.paidAmount ?? 0) + alloc.amount;
        const isFull = totalPaid >= Number(schedule.amount);

        await tx.paymentSchedule.update({
          where: { id: alloc.scheduleId },
          data: {
            status: isFull ? 'PAID' : 'PARTIAL',
            paidDate: isFull ? new Date(dto.paymentDate) : undefined,
            paidAmount: totalPaid,
          },
        });
      }

      await this.updateLoanBalanceTx(tx, loan.id);

      return p;
    });

    return payment;
  }

  async findByLoan(loanId: string) {
    return prisma.payment.findMany({
      where: { loanId },
      include: {
        receivedBy: { select: { id: true, name: true } },
        allocations: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  private async updateLoanBalanceTx(tx: Prisma.TransactionClient, loanId: string) {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { schedule: true },
    });
    if (!loan) return;

    const totalPaid = loan.schedule.reduce(
      (sum, s) => sum + Number(s.paidAmount ?? 0),
      0,
    );
    const newBalance = Math.max(0, Number(loan.totalAmount) - totalPaid);

    const allPaid = loan.schedule.every((s) => s.status === 'PAID');

    await tx.loan.update({
      where: { id: loanId },
      data: {
        balance: newBalance,
        status: allPaid ? 'PAID' : loan.status,
      },
    });
  }
}
