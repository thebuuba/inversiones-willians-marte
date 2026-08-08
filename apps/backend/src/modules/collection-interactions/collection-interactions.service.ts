import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateCollectionInteractionDto } from './dto/create-collection-interaction.dto';
import {
  assertClientAccess,
  assertLoanAccess,
  type PortfolioScope,
} from '../../common/portfolio-scope';

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
  async create(scope: PortfolioScope, dto: CreateCollectionInteractionDto, userId: string) {
    if (!dto.clientId && !dto.loanId) {
      throw new BadRequestException('A client or loan is required');
    }

    if (dto.loanId) {
      await assertLoanAccess(scope, dto.loanId);
    } else if (dto.clientId) {
      await assertClientAccess(scope, dto.clientId);
    }

    const loan = dto.loanId
      ? await prisma.loan.findUnique({
          where: { id: dto.loanId },
          include: { client: { select: { id: true, firstName: true, lastName: true } } },
        })
      : null;
    if (dto.loanId && !loan) throw new NotFoundException('Loan not found');

    const client =
      loan?.client ??
      (dto.clientId
        ? await prisma.client.findUnique({
            where: { id: dto.clientId },
            select: { id: true, firstName: true, lastName: true },
          })
        : null);
    if (!client) throw new NotFoundException('Client not found');

    const hasPromise = dto.result === 'PAYMENT_PROMISE';
    if (hasPromise && !loan) {
      throw new BadRequestException('Payment promises require a loan');
    }
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
          loanId: loan?.id ?? null,
          clientId: client.id,
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
            loanId: loan!.id,
            clientId: client.id,
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
            title: `${loan ? 'Seguimiento de cobro' : 'Contactar cliente'}: ${client.firstName} ${client.lastName}`,
            description: notes,
            dueDate: taskDueDate(taskDate),
            time: dto.nextFollowUpTime ?? '09:00',
            priority: hasPromise ? 'HIGH' : 'MEDIUM',
            category: loan ? 'cobro' : 'cliente',
            clientId: client.id,
            loanId: loan?.id ?? null,
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
          clientId: client.id,
          newValues: {
            loanId: loan?.id ?? null,
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

  async findByLoan(scope: PortfolioScope, loanId: string) {
    await assertLoanAccess(scope, loanId);
    const loan = await prisma.loan.findUnique({ where: { id: loanId }, select: { id: true } });
    if (!loan) throw new NotFoundException('Loan not found');

    await this.markOverduePromisesBroken(loanId);

    return prisma.collectionInteraction.findMany({
      where: { loanId },
      include: interactionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(scope: PortfolioScope, clientId: number) {
    await assertClientAccess(scope, clientId);
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    return prisma.collectionInteraction.findMany({
      where: { clientId },
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
