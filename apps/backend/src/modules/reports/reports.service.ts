import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { calculateCollectionPriority } from './collection-priority';
import { getInvestmentPeriodStatus } from '../investments/investment-period-status';
import {
  clientWhereVisible,
  loanWhereVisible,
  type PortfolioScope,
} from '../../common/portfolio-scope';

@Injectable()
export class ReportsService {
  async overview(scope: PortfolioScope) {
    const [
      dashboard,
      portfolio,
      monthlyCollections,
      dailyIncome,
      weeklyMovement,
      upcomingPayments,
      collectionPriorities,
      investmentPriorities,
    ] = await Promise.all([
      this.dashboard(scope),
      this.portfolioByStatus(scope),
      this.monthlyCollections(scope),
      this.dailyIncome(scope),
      this.weeklyMovement(scope),
      this.upcomingPayments(scope),
      this.collectionPriorities(scope),
      this.investmentPriorities(),
    ]);

    return {
      dashboard,
      portfolio,
      monthlyCollections,
      dailyIncome,
      weeklyMovement,
      upcomingPayments,
      collectionPriorities,
      investmentPriorities,
    };
  }

  async investmentPriorities() {
    const today = new Date();
    const investments = await prisma.investorInvestment.findMany({
      where: { status: 'ACTIVE', startDate: { not: null } },
      select: {
        id: true,
        code: true,
        monthlyPayment: true,
        startDate: true,
        investor: { select: { id: true, name: true } },
        payments: {
          select: { periodMonth: true, periodYear: true, amount: true },
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
          take: 24,
        },
      },
    });
    const urgencyOrder = { OVERDUE: 0, PENDING: 1, UPCOMING: 2 } as const;

    return investments
      .map((investment) => {
        const period = getInvestmentPeriodStatus(
          investment.startDate,
          investment.payments,
          today,
          investment.monthlyPayment,
        );
        if (
          !period.nextDueDate ||
          !['OVERDUE', 'PENDING', 'UPCOMING'].includes(period.paymentStatus)
        ) {
          return null;
        }
        return {
          investmentId: investment.id,
          investmentCode: investment.code,
          investorId: investment.investor.id,
          investorName: investment.investor.name,
          amount: Number(investment.monthlyPayment),
          dueDate: period.nextDueDate,
          paymentStatus: period.paymentStatus as keyof typeof urgencyOrder,
          daysUntilDue: signedDaysBetweenUtc(today, period.nextDueDate),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (a, b) =>
          urgencyOrder[a.paymentStatus] - urgencyOrder[b.paymentStatus] ||
          a.dueDate.getTime() - b.dueDate.getTime(),
      )
      .slice(0, 5);
  }

  async collectionPriorities(scope: PortfolioScope) {
    const today = startOfUtcDay(new Date());
    const loanScopeWhere = loanWhereVisible(scope);
    const loans = await prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        ...(loanScopeWhere ?? {}),
        schedule: {
          some: {
            dueDate: { lt: today },
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
        },
      },
      select: {
        id: true,
        loanNumber: true,
        balance: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            collectionInteractions: {
              select: { createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        schedule: {
          where: {
            dueDate: { lt: today },
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
          select: { dueDate: true, amount: true, paidAmount: true },
          orderBy: { dueDate: 'asc' },
        },
        paymentPromises: {
          where: {
            OR: [
              { status: 'BROKEN' },
              { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: today } },
            ],
          },
          select: { id: true },
        },
      },
      take: 100,
    });

    return loans
      .map((loan) => {
        const earliestDueDate = loan.schedule[0].dueDate;
        const lastContactAt = loan.client.collectionInteractions[0]?.createdAt ?? null;
        const daysOverdue = daysBetweenUtc(earliestDueDate, today);
        const daysSinceLastContact = lastContactAt ? daysBetweenUtc(lastContactAt, today) : null;
        const priority = calculateCollectionPriority({
          daysOverdue,
          overdueInstallments: loan.schedule.length,
          brokenPromises: loan.paymentPromises.length,
          daysSinceLastContact,
        });

        return {
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          clientId: loan.client.id,
          clientName: `${loan.client.firstName} ${loan.client.lastName}`,
          phone: loan.client.phone,
          balance: Number(loan.balance),
          overdueAmount: loan.schedule.reduce(
            (total, installment) =>
              total + Number(installment.amount) - Number(installment.paidAmount ?? 0),
            0,
          ),
          daysOverdue,
          overdueInstallments: loan.schedule.length,
          lastContactAt,
          ...priority,
        };
      })
      .sort((a, b) => b.score - a.score || b.daysOverdue - a.daysOverdue)
      .slice(0, 5);
  }

  async dashboard(scope: PortfolioScope) {
    const todayStart = startOfUtcDay(new Date());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    const loanScopeWhere = loanWhereVisible(scope);
    const clientScopeWhere = clientWhereVisible(scope);

    const [activeLoans, totalClients, paymentsToday, portfolioStats, overdueLoans] =
      await Promise.all([
        prisma.loan.count({ where: { status: 'ACTIVE', ...(loanScopeWhere ?? {}) } }),
        prisma.client.count({ where: { active: true, ...(clientScopeWhere ?? {}) } }),
        prisma.payment.aggregate({
          where: {
            paymentDate: {
              gte: todayStart,
              lt: tomorrowStart,
            },
            ...(loanScopeWhere ? { loan: { is: loanScopeWhere } } : {}),
          },
          _sum: { amount: true },
        }),
        prisma.loan.aggregate({
          where: { status: 'ACTIVE', ...(loanScopeWhere ?? {}) },
          _sum: { balance: true, principal: true },
          _count: true,
        }),
        prisma.loan.count({
          where: {
            status: 'ACTIVE',
            ...(loanScopeWhere ?? {}),
            schedule: {
              some: {
                status: 'OVERDUE',
              },
            },
          },
        }),
      ]);

    return {
      activeLoans,
      totalClients,
      collectionsToday: Number(paymentsToday._sum.amount ?? 0),
      portfolioBalance: Number(portfolioStats._sum.balance ?? 0),
      overdueLoans,
    };
  }

  async portfolioByStatus(scope: PortfolioScope) {
    const groups = await prisma.$queryRaw<
      Array<{ status: string; count: number; balance: number; principal: number }>
    >`
      WITH oldest_unpaid AS (
        SELECT loan_id, MIN(due_date)::date AS due_date
        FROM payment_schedule
        WHERE status::text NOT IN ('PAID', 'CANCELLED')
        GROUP BY loan_id
      ),
      classified AS (
        SELECT
          l.balance,
          l.principal,
          CASE
          WHEN l.status::text = 'PAID' THEN 'PAID'
          WHEN l.status::text = 'WRITTEN_OFF' THEN 'WRITTEN_OFF'
          WHEN l.interest_type::text <> 'INDEFINITE'
            AND l.balance > 0
            AND l.end_date::date < CURRENT_DATE THEN 'EXPIRED'
          WHEN oldest_unpaid.due_date IS NULL
            OR oldest_unpaid.due_date > CURRENT_DATE THEN 'CURRENT'
          WHEN oldest_unpaid.due_date >= CURRENT_DATE - (
            COALESCE((SELECT grace_days FROM system_settings WHERE id = 1), 5)
            * INTERVAL '1 day'
          ) THEN 'PENDING'
          ELSE 'LATE'
          END AS status
        FROM loans l
        LEFT JOIN oldest_unpaid ON oldest_unpaid.loan_id = l.id
        ${scope.isAdmin ? Prisma.empty : Prisma.sql`WHERE ${loanScopeSql(scope)}`}
      )
      SELECT
        status,
        COUNT(*)::int AS count,
        COALESCE(SUM(balance)::float8, 0) AS balance,
        COALESCE(SUM(principal)::float8, 0) AS principal
      FROM classified
      GROUP BY status
      ORDER BY status
    `;

    return groups.map((group) => ({
      status: group.status,
      count: Number(group.count),
      balance: Number(group.balance),
      principal: Number(group.principal),
    }));
  }

  async collectorPerformance(scope: PortfolioScope) {
    const isSelf = !scope.isAdmin;
    const collectors = await prisma.user.findMany({
      where: {
        role: 'COLLECTOR',
        active: true,
        ...(isSelf ? { id: scope.userId } : {}),
      },
      select: {
        id: true,
        name: true,
        _count: { select: { receivedPayments: true } },
      },
    });

    if (collectors.length === 0) {
      return [];
    }

    const totals = await prisma.payment.groupBy({
      by: ['receivedById'],
      where: { receivedById: { in: collectors.map((collector) => collector.id) } },
      _sum: { amount: true },
    });
    const totalByCollector = new Map(
      totals.map((total) => [total.receivedById, Number(total._sum.amount ?? 0)]),
    );

    return collectors.map((collector) => ({
      id: collector.id,
      name: collector.name,
      paymentsCount: collector._count.receivedPayments,
      totalCollected: totalByCollector.get(collector.id) ?? 0,
    }));
  }

  async monthlyCollections(scope: PortfolioScope) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const rows = await prisma.$queryRaw<
      Array<{ month: Date; collected: string; expected: string }>
    >`
      SELECT
        DATE_TRUNC('month', ps.due_date)::date AS month,
        COALESCE(SUM(p.amount) FILTER (WHERE p.id IS NOT NULL), 0) AS collected,
        COALESCE(SUM(ps.amount), 0) AS expected
      FROM payment_schedule ps
      JOIN loans l ON l.id = ps.loan_id
      LEFT JOIN payment_allocations pa ON pa.schedule_id = ps.id
      LEFT JOIN payments p ON p.id = pa.payment_id
      WHERE ps.due_date >= ${sixMonthsAgo}
      ${scope.isAdmin ? Prisma.empty : Prisma.sql`AND ${loanScopeSql(scope)}`}
      GROUP BY DATE_TRUNC('month', ps.due_date)
      ORDER BY month ASC
    `;

    return rows.map((r) => ({
      month: r.month.toLocaleString('default', { month: 'short' }),
      collected: Number(r.collected),
      expected: Number(r.expected),
    }));
  }

  async dailyIncome(scope: PortfolioScope) {
    const startDate = startOfUtcDay(new Date());
    startDate.setUTCDate(startDate.getUTCDate() - 29);

    const rows = await prisma.$queryRaw<
      Array<{ date: Date; capital: string; interest: string; lateFee: string }>
    >`
      WITH days AS (
        SELECT GENERATE_SERIES(${startDate}::date, CURRENT_DATE, '1 day')::date AS date
      ),
      income AS (
        SELECT
          p.payment_date::date AS date,
          SUM(pa.amount) FILTER (WHERE pa.type = 'PRINCIPAL') AS capital,
          SUM(pa.amount) FILTER (WHERE pa.type = 'INTEREST') AS interest,
          SUM(pa.amount) FILTER (WHERE pa.type = 'PENALTY') AS late_fee
        FROM payments p
        JOIN loans l ON l.id = p.loan_id
        JOIN payment_allocations pa ON pa.payment_id = p.id
        WHERE p.payment_date >= ${startDate}
        ${scope.isAdmin ? Prisma.empty : Prisma.sql`AND ${loanScopeSql(scope)}`}
        GROUP BY p.payment_date::date
      )
      SELECT
        days.date,
        COALESCE(income.capital, 0) AS capital,
        COALESCE(income.interest, 0) AS interest,
        COALESCE(income.late_fee, 0) AS "lateFee"
      FROM days
      LEFT JOIN income USING (date)
      ORDER BY days.date
    `;

    return rows.map((row) => {
      const date = row.date.toISOString().slice(0, 10);
      return {
        date,
        label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
        capital: Number(row.capital),
        interest: Number(row.interest),
        lateFee: Number(row.lateFee),
      };
    });
  }

  async weeklyMovement(scope: PortfolioScope) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const rows = await prisma.$queryRaw<Array<{ day: string; nuevos: string; cerrados: string }>>`
      WITH days(dow, day) AS (
        VALUES (1, 'Lun'), (2, 'Mar'), (3, 'Mié'), (4, 'Jue'), (5, 'Vie'), (6, 'Sáb'), (7, 'Dom')
      ),
      new_loans AS (
        SELECT EXTRACT(ISODOW FROM start_date)::int AS dow, COUNT(*) AS count
        FROM loans l
        WHERE l.start_date >= ${weekStart} AND l.start_date <= ${weekEnd}
        ${scope.isAdmin ? Prisma.empty : Prisma.sql`AND ${loanScopeSql(scope)}`}
        GROUP BY EXTRACT(ISODOW FROM l.start_date)::int
      ),
      closed_loans AS (
        SELECT EXTRACT(ISODOW FROM end_date)::int AS dow, COUNT(*) AS count
        FROM loans l
        WHERE l.status = 'PAID' AND l.end_date IS NOT NULL
          AND l.end_date >= ${weekStart} AND l.end_date <= ${weekEnd}
        ${scope.isAdmin ? Prisma.empty : Prisma.sql`AND ${loanScopeSql(scope)}`}
        GROUP BY EXTRACT(ISODOW FROM l.end_date)::int
      )
      SELECT
        d.day,
        COALESCE(n.count, 0) AS nuevos,
        COALESCE(c.count, 0) AS cerrados
      FROM days d
      LEFT JOIN new_loans n ON n.dow = d.dow
      LEFT JOIN closed_loans c ON c.dow = d.dow
      ORDER BY d.dow
    `;

    return rows.map((r) => ({
      day: r.day,
      nuevos: Number(r.nuevos),
      cerrados: Number(r.cerrados),
    }));
  }

  async upcomingPayments(scope: PortfolioScope, daysAhead = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + daysAhead);

    const loanScopeWhere = loanWhereVisible(scope);
    const schedules = await prisma.paymentSchedule.findMany({
      where: {
        dueDate: { gte: today, lte: future },
        status: { in: ['PENDING', 'PARTIAL'] },
        ...(loanScopeWhere ? { loan: { is: loanScopeWhere } } : {}),
      },
      select: {
        id: true,
        dueDate: true,
        amount: true,
        status: true,
        loan: {
          select: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return schedules.map((s) => ({
      id: s.id,
      clientName: s.loan.client.firstName + ' ' + s.loan.client.lastName,
      dueDate: s.dueDate,
      amount: Number(s.amount),
      status: s.status,
    }));
  }
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetweenUtc(from: Date, to: Date) {
  return Math.max(
    0,
    Math.floor((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / 86_400_000),
  );
}

function signedDaysBetweenUtc(from: Date, to: Date) {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / 86_400_000);
}

function loanScopeSql(scope: PortfolioScope) {
  if (scope.portfolioIds.length > 0) {
    return Prisma.sql`(l.portfolio_id IN (${Prisma.join(scope.portfolioIds)}) OR l.created_by = ${scope.userId})`;
  }
  return Prisma.sql`(l.created_by = ${scope.userId})`;
}
