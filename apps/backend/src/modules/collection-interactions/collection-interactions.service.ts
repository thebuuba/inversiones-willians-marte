import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateCollectionInteractionDto } from './dto/create-collection-interaction.dto';

const interactionInclude = {
  createdBy: { select: { id: true, name: true } },
  promise: true,
  followUpTask: true,
} as const;

function dateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function taskDueDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
}

function dominicanToday(): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return dateOnly(`${value.year}-${value.month}-${value.day}`);
}

@Injectable()
export class CollectionInteractionsService {
  async create(dto: CreateCollectionInteractionDto, userId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: dto.loanId },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    const hasPromise = dto.result === 'PAYMENT_PROMISE';
    if (hasPromise && (!dto.promiseAmount || !dto.promiseDate)) {
      throw new BadRequestException('Payment promises require an amount and due date');
    }
    if (!hasPromise && (dto.promiseAmount !== undefined || dto.promiseDate !== undefined)) {
      throw new BadRequestException('Promise details require the PAYMENT_PROMISE result');
    }

    const notes = dto.notes.trim();
    if (!notes) throw new BadRequestException('Notes are required');

    return prisma.$transaction(async (tx) => {
      const interaction = await tx.collectionInteraction.create({
        data: {
          loanId: loan.id,
          clientId: loan.clientId,
          channel: dto.channel,
          result: dto.result,
          notes,
          nextFollowUpDate: dto.nextFollowUpDate ? dateOnly(dto.nextFollowUpDate) : null,
          nextFollowUpTime: dto.nextFollowUpTime ?? null,
          createdById: userId,
        },
      });

      if (hasPromise) {
        await tx.paymentPromise.create({
          data: {
            interactionId: interaction.id,
            loanId: loan.id,
            clientId: loan.clientId,
            amount: dto.promiseAmount!,
            dueDate: dateOnly(dto.promiseDate!),
            createdById: userId,
          },
        });
      }

      const taskDate = dto.nextFollowUpDate ?? (hasPromise ? dto.promiseDate : undefined);
      if (taskDate) {
        await tx.task.create({
          data: {
            title: `Seguimiento de cobro: ${loan.client.firstName} ${loan.client.lastName}`,
            description: notes,
            dueDate: taskDueDate(taskDate),
            time: dto.nextFollowUpTime ?? '09:00',
            priority: hasPromise ? 'HIGH' : 'MEDIUM',
            category: 'cobro',
            clientId: loan.clientId,
            loanId: loan.id,
            collectionInteractionId: interaction.id,
            createdById: userId,
            assignedToId: userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'COLLECTION_INTERACTION_CREATED',
          entityType: 'CollectionInteraction',
          entityId: interaction.id,
          clientId: loan.clientId,
          newValues: {
            loanId: loan.id,
            channel: dto.channel,
            result: dto.result,
            nextFollowUpDate: dto.nextFollowUpDate ?? null,
            promiseAmount: dto.promiseAmount ?? null,
            promiseDate: dto.promiseDate ?? null,
          },
        },
      });

      return tx.collectionInteraction.findUnique({
        where: { id: interaction.id },
        include: interactionInclude,
      });
    });
  }

  async findByLoan(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId }, select: { id: true } });
    if (!loan) throw new NotFoundException('Loan not found');

    await this.markOverduePromisesBroken(loanId);

    return prisma.collectionInteraction.findMany({
      where: { loanId },
      include: interactionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async markOverduePromisesBroken(loanId: string) {
    await prisma.paymentPromise.updateMany({
      where: {
        loanId,
        dueDate: { lt: dominicanToday() },
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      data: { status: 'BROKEN' },
    });
  }
}
