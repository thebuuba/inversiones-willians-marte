import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { CreateLoanDto } from './dto/create-loan.dto';
import { AmortizationService } from './amortization.service';
import { AddLoanCapitalDto } from './dto/add-loan-capital.dto';
import { LoanPayoffService } from './loan-payoff.service';
import {
  addPaymentInterval,
  calculateIndefiniteInterest,
  calculateProratedIndefiniteInterest,
} from './indefinite-loan';
import { normalizePagination } from '../../common/pagination';
import { moneyToCents } from '../../common/money';
import { getLoanCollectionStatus } from '../../common/loan-collection-status';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { syncLoanLateFees } from './late-fee';

type LoanListRow = {
  id: string;
  loanNumber: number;
  clientId: number;
  productId: string;
  principal: number;
  interestRate: number;
  interestType: string;
  totalAmount: number;
  paymentFreq: string;
  term: number;
  startDate: Date;
  endDate: Date | null;
  status: string;
  balance: number;
  notes: string | null;
  createdAt: Date;
  clientFirstName: string;
  clientLastName: string;
  clientIdentification: string | null;
  productName: string;
};

function annualizedManualRate(monthlyRate: number, frequency: string): number {
  if (frequency === 'WEEKLY') return monthlyRate * 13;
  if (frequency === 'BIWEEKLY') return monthlyRate * 13;
  if (frequency === 'DAILY') return monthlyRate * 12;
  if (frequency === 'QUARTERLY') return monthlyRate * 12;
  return monthlyRate * 12;
}

@Injectable()
export class LoansService {
  constructor(
    private amortization: AmortizationService,
    private payoff: LoanPayoffService,
  ) {}

  private async createReceipt(tx: Prisma.TransactionClient, loanId: string, userId: string) {
    const existing = await tx.loanReceipt.findUnique({ where: { loanId } });
    if (existing) return existing;

    const [loan, settings] = await Promise.all([
      tx.loan.findUnique({
        where: { id: loanId },
        include: {
          client: true,
          product: true,
          createdBy: { select: { name: true } },
          schedule: { orderBy: { dueDate: 'asc' }, take: 1 },
        },
      }),
      tx.systemSettings.findUnique({ where: { id: 1 } }),
    ]);
    if (!loan) throw new NotFoundException('Loan not found');

    const issuedAt = new Date();
    const snapshot = {
      company: {
        name: settings?.companyName ?? 'Inversiones Willians Marte',
        taxId: settings?.companyTaxId ?? null,
        email: settings?.companyEmail ?? null,
        phone: settings?.companyPhone ?? null,
        address: settings?.companyAddress ?? null,
      },
      client: {
        id: loan.client.id,
        name: `${loan.client.firstName} ${loan.client.lastName}`.trim(),
        identification: loan.client.identification ?? null,
      },
      loan: {
        id: loan.id,
        number: loan.loanNumber,
        product: loan.product.name,
        operationType: loan.operationType,
        principal: Number(loan.principal),
        disbursedAmount: Number(loan.disbursedAmount ?? loan.principal),
        paymentFrequency: loan.paymentFreq,
        term: loan.term,
        firstPaymentDate: loan.schedule[0]?.dueDate.toISOString() ?? null,
        purpose: loan.notes ?? null,
        createdAt: loan.createdAt.toISOString(),
      },
      issuance: {
        receiptNumber: loan.loanNumber,
        issuedAt: issuedAt.toISOString(),
        generatedBy: loan.createdBy.name,
      },
    };

    return tx.loanReceipt.create({
      data: {
        loanId,
        receiptNumber: loan.loanNumber,
        snapshot,
        generatedById: userId,
        createdAt: issuedAt,
      },
    });
  }

  async create(dto: CreateLoanDto, userId: string) {
    return prisma.$transaction(
      async (tx) => {
        const product = await tx.loanProduct.findUnique({ where: { id: dto.productId } });
        if (!product || !product.active) throw new NotFoundException('Loan product not found');

        const client = await tx.client.findUnique({ where: { id: dto.clientId } });
        if (!client || !client.active) throw new NotFoundException('Client not found');

        if (dto.term > (product.maxTerm ?? Infinity)) {
          throw new BadRequestException(`Term exceeds maximum of ${product.maxTerm}`);
        }

        const operationType = dto.operationType ?? 'NORMAL';
        const sourceLoanIds = dto.sourceLoanIds ?? [];
        if ((operationType === 'NORMAL') !== (sourceLoanIds.length === 0)) {
          throw new BadRequestException('Replacement loans require source loans');
        }

        const settlementDate = new Date(
          `${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' })}T00:00:00.000Z`,
        );
        const sourceLoans = sourceLoanIds.length
          ? await tx.loan.findMany({
              where: { id: { in: sourceLoanIds } },
              include: {
                schedule: { orderBy: { dueDate: 'asc' } },
                lateFees: true,
                payments: { include: { allocations: true } },
                capitalMovements: { orderBy: { effectiveDate: 'asc' } },
              },
            })
          : [];

        if (
          sourceLoans.length !== sourceLoanIds.length ||
          sourceLoans.some(
            (loan) =>
              loan.clientId !== dto.clientId || !['ACTIVE', 'OVERDUE'].includes(loan.status),
          )
        ) {
          throw new BadRequestException('Source loans must be active loans from this client');
        }

        const settlements = sourceLoans.map((loan) => ({
          loan,
          amount: this.payoff.quote(loan, settlementDate).totalToPay,
        }));
        const settlementTotal = settlements.reduce((sum, item) => sum + item.amount, 0);
        const principalCents = moneyToCents(dto.principal);
        const settlementCents = moneyToCents(settlementTotal);
        if (operationType === 'REFINANCE' && principalCents !== settlementCents) {
          throw new BadRequestException('Refinancing amount must equal the settled balance');
        }
        if (operationType === 'REENGAGEMENT' && principalCents <= settlementCents) {
          throw new BadRequestException('Re-engagement amount must exceed the settled balance');
        }

        const interestType = dto.amortizationType ?? product.interestType;
        const paymentFrequency = dto.paymentFrequency ?? product.paymentFrequency;
        const interestRate = dto.interestRate ?? Number(product.interestRate);
        const scheduleInterestRate =
          dto.interestRate == null
            ? Number(product.interestRate)
            : annualizedManualRate(dto.interestRate, paymentFrequency);
        const schedule = this.amortization.calculate({
          principal: dto.principal,
          interestRate: scheduleInterestRate,
          interestType,
          paymentFrequency,
          term: dto.term,
          startDate: new Date(dto.startDate),
          firstPaymentDate: dto.firstPaymentDate ? new Date(dto.firstPaymentDate) : undefined,
          customPayment: dto.customPayment,
        });
        const paidInstallments = dto.paidInstallments ?? 0;
        const paidLateFee = dto.paidLateFee ?? 0;
        if (paidInstallments > schedule.length) {
          throw new BadRequestException('Paid installments exceed the loan term');
        }
        if (paidLateFee > 0 && paidInstallments === 0) {
          throw new BadRequestException('A paid late fee requires at least one paid installment');
        }
        const totalAmount = schedule.reduce((sum, row) => sum + row.amount, 0);
        const initiallyPaidAmount = schedule
          .slice(0, paidInstallments)
          .reduce((sum, row) => sum + row.amount, 0);
        const lastRow = schedule[schedule.length - 1];
        const balance =
          interestType === 'INDEFINITE'
            ? dto.principal
            : Math.round((totalAmount - initiallyPaidAmount) * 100) / 100;
        const disbursedAmount =
          operationType === 'NORMAL' ? dto.principal : (principalCents - settlementCents) / 100;

        const loan = await tx.loan.create({
          data: {
            clientId: dto.clientId,
            productId: dto.productId,
            principal: dto.principal,
            interestRate,
            interestType,
            totalAmount: Math.round(totalAmount * 100) / 100,
            paymentFreq: paymentFrequency,
            term: dto.term,
            startDate: new Date(dto.startDate),
            endDate: interestType === 'INDEFINITE' ? null : (lastRow?.dueDate ?? null),
            balance,
            status:
              interestType !== 'INDEFINITE' && paidInstallments === schedule.length
                ? 'PAID'
                : 'ACTIVE',
            notes: dto.notes,
            portfolioId: dto.portfolioId ?? null,
            createdById: userId,
            operationType,
            disbursedAmount,
            lateFeeEnabled: dto.lateFeeEnabled ?? false,
            lateFeeMode: dto.lateFeeMode ?? 'PER_INSTALLMENT',
            lateFeeCalculation: dto.lateFeeCalculation ?? 'PERCENTAGE',
            lateFeeValue: dto.lateFeeValue ?? 5,
            lateFeeGraceDays: dto.lateFeeGraceDays ?? 5,
            schedule: {
              create: schedule.map((row, index) => ({
                dueDate: row.dueDate,
                amount: row.amount,
                principalPart: row.principalPart,
                interestPart: row.interestPart,
                balanceAfter: row.balanceAfter,
                status: index < paidInstallments ? 'PAID' : 'PENDING',
                paidDate: index < paidInstallments ? row.dueDate : null,
                paidAmount: index < paidInstallments ? row.amount : null,
              })),
            },
          },
          include: {
            client: true,
            product: true,
            schedule: { orderBy: { dueDate: 'asc' } },
          },
        });

        for (const [index, paidSchedule] of (paidInstallments
          ? loan.schedule.slice(0, paidInstallments)
          : []
        ).entries()) {
          const lateFee = index === paidInstallments - 1 ? paidLateFee : 0;
          await tx.payment.create({
            data: {
              loanId: loan.id,
              clientId: dto.clientId,
              amount: Number(paidSchedule.amount) + lateFee,
              paymentDate: paidSchedule.dueDate,
              receivedById: userId,
              notes: 'Pago histórico registrado con el préstamo',
              allocations: {
                create: [
                  {
                    scheduleId: paidSchedule.id,
                    amount: paidSchedule.interestPart,
                    type: 'INTEREST' as const,
                  },
                  {
                    scheduleId: paidSchedule.id,
                    amount: paidSchedule.principalPart,
                    type: 'PRINCIPAL' as const,
                  },
                  ...(lateFee
                    ? [
                        {
                          scheduleId: paidSchedule.id,
                          amount: lateFee,
                          type: 'PENALTY' as const,
                        },
                      ]
                    : []),
                ].filter((allocation) => Number(allocation.amount) > 0),
              },
            },
          });
          if (lateFee) {
            await tx.lateFee.create({
              data: {
                loanId: loan.id,
                scheduleId: paidSchedule.id,
                amount: lateFee,
                calculatedDate: paidSchedule.dueDate,
                paid: true,
                paidAmount: lateFee,
              },
            });
          }
        }

        if (settlements.length) {
          await tx.loanReplacement.createMany({
            data: settlements.map(({ loan: source, amount }) => ({
              newLoanId: loan.id,
              sourceLoanId: source.id,
              settlementAmount: amount,
            })),
          });
          await tx.loan.updateMany({
            where: { id: { in: sourceLoanIds } },
            data: { status: 'RESTRUCTURED', balance: 0 },
          });
          await tx.paymentSchedule.updateMany({
            where: { loanId: { in: sourceLoanIds }, status: { not: 'PAID' } },
            data: { status: 'CANCELLED' },
          });
          await tx.paymentPromise.updateMany({
            where: {
              loanId: { in: sourceLoanIds },
              status: { in: ['PENDING', 'PARTIAL', 'BROKEN'] },
            },
            data: { status: 'CANCELLED' },
          });
          await tx.lateFee.updateMany({
            where: { loanId: { in: sourceLoanIds }, paid: false },
            data: { paid: true },
          });
        }

        await tx.auditLog.create({
          data: {
            userId,
            action: 'LOAN_CREATED',
            entityType: 'Loan',
            entityId: loan.id,
            clientId: dto.clientId,
            newValues: {
              loanNumber: loan.loanNumber,
              principal: dto.principal,
              totalAmount: Number(loan.totalAmount),
              productId: dto.productId,
              portfolioId: dto.portfolioId ?? null,
              operationType,
              sourceLoanIds,
              settlementTotal,
              disbursedAmount,
              paidInstallments,
              paidLateFee,
            },
          },
        });

        const receipt = dto.generateReceipt
          ? await this.createReceipt(tx, loan.id, userId)
          : null;
        return { ...loan, receipt };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findAll(status?: string, search?: string, take = 50, skip = 0, sort?: string) {
    const { take: pageSize, skip: offset } = normalizePagination(take, skip);
    const filters: Prisma.Sql[] = [];

    const oldestUnpaidDue = Prisma.sql`(
      SELECT MIN(ps.due_date)::date
      FROM payment_schedule ps
      WHERE ps.loan_id = l.id
        AND ps.status::text NOT IN ('PAID', 'CANCELLED')
    )`;
    const graceDaysSql = Prisma.sql`COALESCE(
      (SELECT grace_days FROM system_settings WHERE id = 1),
      5
    )`;
    const collectibleLoan = Prisma.sql`l.status::text <> 'PAID'`;
    const expiredLoan = Prisma.sql`(
      l.interest_type::text <> 'INDEFINITE'
      AND l.balance > 0
      AND l.end_date::date < CURRENT_DATE
    )`;

    if (status === 'PAID') {
      filters.push(Prisma.sql`l.status::text = 'PAID'`);
    } else if (status === 'EXPIRED') {
      filters.push(Prisma.sql`${collectibleLoan} AND ${expiredLoan}`);
    } else if (status === 'CURRENT') {
      filters.push(
        Prisma.sql`${collectibleLoan}
          AND NOT ${expiredLoan}
          AND (${oldestUnpaidDue} IS NULL OR ${oldestUnpaidDue} > CURRENT_DATE)`,
      );
    } else if (status === 'PENDING') {
      filters.push(
        Prisma.sql`${collectibleLoan}
          AND NOT ${expiredLoan}
          AND ${oldestUnpaidDue} <= CURRENT_DATE
          AND ${oldestUnpaidDue} >= CURRENT_DATE - (${graceDaysSql} * INTERVAL '1 day')`,
      );
    } else if (status === 'LATE') {
      filters.push(
        Prisma.sql`${collectibleLoan}
          AND NOT ${expiredLoan}
          AND ${oldestUnpaidDue} < CURRENT_DATE - (${graceDaysSql} * INTERVAL '1 day')`,
      );
    } else if (status) {
      filters.push(Prisma.sql`l.status::text = ${status}`);
    }
    if (search) {
      const pattern = `%${search}%`;
      filters.push(Prisma.sql`(
        c.first_name ILIKE ${pattern}
        OR c.last_name ILIKE ${pattern}
        OR c.identification ILIKE ${pattern}
        OR l.id ILIKE ${pattern}
        OR l.loan_number::text ILIKE ${pattern}
      )`);
    }

    const whereSql =
      filters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}` : Prisma.empty;
    const orderSql =
      sort === 'oldest'
        ? Prisma.sql`l.created_at ASC`
        : sort === 'amount_desc'
          ? Prisma.sql`l.principal DESC, l.created_at DESC`
          : sort === 'amount_asc'
            ? Prisma.sql`l.principal ASC, l.created_at DESC`
            : Prisma.sql`l.created_at DESC`;
    const rows = await prisma.$queryRaw<LoanListRow[]>`
      SELECT
        l.id,
        l.loan_number AS "loanNumber",
        l.client_id AS "clientId",
        l.product_id AS "productId",
        l.principal::float8 AS principal,
        l.interest_rate::float8 AS "interestRate",
        l.interest_type::text AS "interestType",
        l.total_amount::float8 AS "totalAmount",
        l.payment_frequency::text AS "paymentFreq",
        l.term,
        l.start_date AS "startDate",
        l.end_date AS "endDate",
        l.status::text AS status,
        l.balance::float8 AS balance,
        l.notes,
        l.created_at AS "createdAt",
        c.first_name AS "clientFirstName",
        c.last_name AS "clientLastName",
        c.identification AS "clientIdentification",
        p.name AS "productName"
      FROM loans l
      JOIN clients c ON c.id = l.client_id
      JOIN loan_products p ON p.id = l.product_id
      ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${pageSize + 1}
      OFFSET ${offset}
    `;
    const hasMore = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);
    const [settings, schedules] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { id: 1 } }),
      prisma.paymentSchedule.findMany({
        where: {
          loanId: { in: pageRows.map((row) => row.id) },
        },
        select: {
          loanId: true,
          dueDate: true,
          status: true,
          amount: true,
          paidAmount: true,
        },
      }),
    ]);
    const schedulesByLoan = new Map<string, typeof schedules>();
    for (const schedule of schedules) {
      const current = schedulesByLoan.get(schedule.loanId) ?? [];
      current.push(schedule);
      schedulesByLoan.set(schedule.loanId, current);
    }
    const graceDays = settings?.graceDays ?? 5;

    const aggregation = await prisma.$queryRaw<Array<{ count: number; totalPrincipal: number }>>`
      SELECT COUNT(*)::int AS count, COALESCE(SUM(l.principal)::float8, 0) AS "totalPrincipal"
      FROM loans l
      JOIN clients c ON c.id = l.client_id
      ${whereSql}
    `;
    const total = hasMore ? Number(aggregation[0]?.count ?? 0) : offset + pageRows.length;
    const totalPrincipal = Number(aggregation[0]?.totalPrincipal ?? 0);

    return {
      data: pageRows.map((row) => {
        const loanSchedules = schedulesByLoan.get(row.id) ?? [];
        const collectibleSchedules = loanSchedules.filter(
          (schedule) => schedule.status !== 'CANCELLED',
        );
        const totalScheduled = collectibleSchedules.reduce(
          (sum, schedule) => sum + Number(schedule.amount),
          0,
        );
        const totalPaid = collectibleSchedules.reduce(
          (sum, schedule) => sum + Number(schedule.paidAmount ?? 0),
          0,
        );
        const nextPaymentDate =
          collectibleSchedules
            .filter((schedule) => schedule.status !== 'PAID')
            .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())[0]?.dueDate ??
          null;

        return {
          id: row.id,
          paidInstallments: collectibleSchedules.filter((schedule) => schedule.status === 'PAID')
            .length,
          totalInstallments: collectibleSchedules.length,
          paymentProgress:
            totalScheduled > 0
              ? Math.min(100, Math.max(0, Math.round((totalPaid / totalScheduled) * 100)))
              : 0,
          nextPaymentDate,
          loanNumber: row.loanNumber,
          clientId: row.clientId,
          productId: row.productId,
          principal: row.principal,
          interestRate: row.interestRate,
          interestType: row.interestType,
          totalAmount: row.totalAmount,
          paymentFreq: row.paymentFreq,
          term: row.term,
          startDate: row.startDate,
          endDate: row.endDate,
          status: row.status,
          collectionStatus: getLoanCollectionStatus(
            {
              ...row,
              schedule: (schedulesByLoan.get(row.id) ?? []).filter(
                (schedule) => schedule.status !== 'PAID' && schedule.status !== 'CANCELLED',
              ),
            },
            graceDays,
          ),
          balance: row.balance,
          notes: row.notes,
          createdAt: row.createdAt,
          client: {
            id: row.clientId,
            firstName: row.clientFirstName,
            lastName: row.clientLastName,
            identification: row.clientIdentification,
          },
          product: {
            id: row.productId,
            name: row.productName,
          },
        };
      }),
      total,
      totalPrincipal,
    };
  }

  async findOne(id: string) {
    await syncLoanLateFees(id);
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        client: true,
        product: true,
        portfolio: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        schedule: { orderBy: { dueDate: 'asc' } },
        lateFees: { orderBy: { calculatedDate: 'desc' } },
        payments: {
          include: {
            allocations: true,
            receivedBy: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
        capitalMovements: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { effectiveDate: 'desc' },
        },
        collectionInteractions: {
          include: {
            createdBy: { select: { id: true, name: true } },
            promise: true,
            followUpTask: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        receipt: true,
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const graceDays = settings?.graceDays ?? 5;
    if (
      loan.status === 'ACTIVE' &&
      loan.interestType === 'INDEFINITE' &&
      !loan.schedule.some(
        (schedule) =>
          schedule.status === 'PENDING' ||
          schedule.status === 'PARTIAL' ||
          schedule.status === 'OVERDUE',
      )
    ) {
      const lastDueDate = loan.schedule.at(-1)?.dueDate ?? loan.startDate;
      const dueDate = addPaymentInterval(lastDueDate, loan.paymentFreq);
      const amount = calculateIndefiniteInterest(
        loan.principal,
        loan.interestRate,
        loan.paymentFreq,
      );
      const nextSchedule = await prisma.paymentSchedule.upsert({
        where: { loanId_dueDate: { loanId: loan.id, dueDate } },
        update: {},
        create: {
          loanId: loan.id,
          dueDate,
          amount,
          principalPart: 0,
          interestPart: amount,
          balanceAfter: loan.principal,
        },
      });
      await prisma.loan.update({
        where: { id: loan.id },
        data: { totalAmount: amount },
      });
      const schedule = [...loan.schedule, nextSchedule].sort(
        (left, right) => left.dueDate.getTime() - right.dueDate.getTime(),
      );
      return {
        ...loan,
        totalAmount: amount,
        schedule,
        graceDays,
        collectionStatus: getLoanCollectionStatus({ ...loan, schedule }, graceDays),
      };
    }
    return {
      ...loan,
      graceDays,
      collectionStatus: getLoanCollectionStatus(loan, graceDays),
    };
  }

  async getReceipt(id: string) {
    const receipt = await prisma.loanReceipt.findUnique({ where: { loanId: id } });
    if (!receipt) throw new NotFoundException('Loan receipt not found');
    return receipt;
  }

  async ensureReceipt(id: string, userId: string) {
    return prisma.$transaction((tx) => this.createReceipt(tx, id, userId), {
      isolationLevel: 'Serializable',
    });
  }

  async addCapital(id: string, dto: AddLoanCapitalDto, userId: string) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id },
        include: {
          schedule: { orderBy: { dueDate: 'asc' } },
          capitalMovements: { orderBy: { effectiveDate: 'asc' } },
        },
      });
      if (!loan) throw new NotFoundException('Loan not found');
      if (loan.status !== 'ACTIVE') throw new BadRequestException('Loan is not active');
      if (loan.interestType !== 'INDEFINITE') {
        throw new BadRequestException('Capital additions are only enabled for indefinite loans');
      }

      const movement = await tx.loanCapitalMovement.create({
        data: {
          loanId: id,
          amount: dto.amount,
          effectiveDate: new Date(dto.effectiveDate),
          notes: dto.notes,
          createdById: userId,
        },
      });
      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          principal: { increment: dto.amount },
          balance: { increment: dto.amount },
        },
        select: { principal: true, balance: true },
      });
      const principal = Number(updatedLoan.principal);
      const balance = Number(updatedLoan.balance);
      const effectiveDate = new Date(dto.effectiveDate);
      const capitalMovements = [...loan.capitalMovements, { amount: dto.amount, effectiveDate }];
      const pendingSchedule = loan.schedule.find(
        (schedule) =>
          schedule.status === 'PENDING' ||
          schedule.status === 'PARTIAL' ||
          schedule.status === 'OVERDUE',
      );
      const lastSchedule = loan.schedule.at(-1);
      const dueDate =
        pendingSchedule?.dueDate ??
        addPaymentInterval(lastSchedule?.dueDate ?? loan.startDate, loan.paymentFreq);
      const previousDueDate =
        [...loan.schedule].reverse().find((schedule) => schedule.dueDate < dueDate)?.dueDate ??
        loan.startDate;
      const interestAmount = calculateProratedIndefiniteInterest({
        currentPrincipal: principal,
        annualRate: loan.interestRate,
        frequency: loan.paymentFreq,
        periodStart: previousDueDate,
        periodEnd: dueDate,
        capitalMovements,
      });

      if (pendingSchedule) {
        await tx.paymentSchedule.update({
          where: { id: pendingSchedule.id },
          data: {
            amount: interestAmount,
            interestPart: interestAmount,
            balanceAfter: principal,
          },
        });
      } else {
        await tx.paymentSchedule.upsert({
          where: { loanId_dueDate: { loanId: id, dueDate } },
          update: {},
          create: {
            loanId: id,
            dueDate,
            amount: interestAmount,
            principalPart: 0,
            interestPart: interestAmount,
            balanceAfter: principal,
          },
        });
      }
      await tx.loan.update({
        where: { id },
        data: { totalAmount: interestAmount },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'LOAN_CAPITAL_ADDED',
          entityType: 'Loan',
          entityId: id,
          clientId: loan.clientId,
          oldValues: { principal: principal - dto.amount, balance: balance - dto.amount },
          newValues: {
            amount: dto.amount,
            effectiveDate: dto.effectiveDate,
            principal,
            balance,
            notes: dto.notes ?? null,
          },
        },
      });
      return movement;
    });
  }

  async update(id: string, dto: UpdateLoanDto, userId?: string) {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException('Loan not found');

    const data: Record<string, unknown> = {};
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.portfolioId !== undefined) data.portfolioId = dto.portfolioId;
    if (dto.interestRate !== undefined) data.interestRate = dto.interestRate;
    if (dto.lateFeeEnabled !== undefined) data.lateFeeEnabled = dto.lateFeeEnabled;
    if (dto.lateFeeMode !== undefined) data.lateFeeMode = dto.lateFeeMode;
    if (dto.lateFeeCalculation !== undefined) data.lateFeeCalculation = dto.lateFeeCalculation;
    if (dto.lateFeeValue !== undefined) data.lateFeeValue = dto.lateFeeValue;
    if (dto.lateFeeGraceDays !== undefined) data.lateFeeGraceDays = dto.lateFeeGraceDays;

    const updated = await prisma.loan.update({ where: { id }, data });
    if (dto.lateFeeEnabled === false) {
      await prisma.lateFee.deleteMany({ where: { loanId: id, paid: false } });
    } else if (
      dto.lateFeeEnabled ||
      dto.lateFeeMode ||
      dto.lateFeeCalculation ||
      dto.lateFeeValue !== undefined ||
      dto.lateFeeGraceDays !== undefined
    ) {
      await syncLoanLateFees(id);
    }

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'LOAN_UPDATED',
          entityType: 'Loan',
          entityId: id,
          clientId: loan.clientId,
          oldValues: {
            notes: loan.notes,
            status: loan.status,
            portfolioId: loan.portfolioId,
            interestRate: Number(loan.interestRate),
            lateFeeEnabled: loan.lateFeeEnabled,
            lateFeeMode: loan.lateFeeMode,
            lateFeeCalculation: loan.lateFeeCalculation,
            lateFeeValue: Number(loan.lateFeeValue),
            lateFeeGraceDays: loan.lateFeeGraceDays,
          },
          newValues: { ...dto },
        },
      });
    }

    return updated;
  }

  async getPayoffQuote(id: string, payoffDate: string) {
    const normalizedDate = new Date(`${payoffDate}T00:00:00.000Z`);
    if (Number.isNaN(normalizedDate.getTime()))
      throw new BadRequestException('Invalid payoff date');
    await syncLoanLateFees(id);
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        schedule: { orderBy: { dueDate: 'asc' } },
        lateFees: true,
        payments: {
          include: {
            allocations: true,
            receivedBy: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
        capitalMovements: {
          orderBy: { effectiveDate: 'asc' },
        },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    return this.payoff.quote(loan, normalizedDate);
  }

  async remove(id: string) {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException('Loan not found');

    await prisma.$transaction(async (tx) => {
      const paymentIds = (
        await tx.payment.findMany({ where: { loanId: id }, select: { id: true } })
      ).map((p) => p.id);
      if (paymentIds.length > 0) {
        await tx.paymentAllocation.deleteMany({ where: { paymentId: { in: paymentIds } } });
      }
      await tx.payment.deleteMany({ where: { loanId: id } });
      await tx.paymentPromise.deleteMany({ where: { loanId: id } });
      await tx.task.deleteMany({ where: { loanId: id } });
      await tx.collectionInteraction.deleteMany({ where: { loanId: id } });
      await tx.lateFee.deleteMany({ where: { loanId: id } });
      await tx.loanCapitalMovement.deleteMany({ where: { loanId: id } });
      await tx.paymentSchedule.deleteMany({ where: { loanId: id } });
      await tx.loan.delete({ where: { id } });
    });

    return { deleted: true };
  }

  async getSummary(id: string) {
    const loan = await this.findOne(id);

    const totalPaid = loan.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paidInstallments = loan.schedule.filter((s) => s.status === 'PAID').length;
    const overdueInstallments = loan.schedule.filter(
      (s) => s.status === 'OVERDUE' || (s.status === 'PENDING' && s.dueDate < new Date()),
    ).length;

    return {
      loanId: loan.id,
      totalAmount: Number(loan.totalAmount),
      balance: Number(loan.balance),
      totalPaid,
      remaining: Number(loan.balance),
      paidInstallments,
      totalInstallments: loan.schedule.length,
      overdueInstallments,
      progress: Math.round((totalPaid / Number(loan.totalAmount)) * 100),
    };
  }
}
