import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';

@Injectable()
export class ReportsService {
  async dashboard() {
    const [activeLoans, totalClients, paymentsToday, portfolioStats, overdueLoans] =
      await Promise.all([
        prisma.loan.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count({ where: { active: true } }),
        prisma.payment.aggregate({
          where: {
            paymentDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          _sum: { amount: true },
        }),
        prisma.loan.aggregate({
          where: { status: 'ACTIVE' },
          _sum: { balance: true, principal: true },
          _count: true,
        }),
        prisma.loan.count({
          where: {
            status: 'ACTIVE',
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

  async portfolioByStatus() {
    const groups = await prisma.loan.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { balance: true, principal: true },
    });

    return groups.map((g) => ({
      status: g.status,
      count: g._count.id,
      balance: Number(g._sum.balance ?? 0),
      principal: Number(g._sum.principal ?? 0),
    }));
  }

  async collectorPerformance() {
    const collectors = await prisma.user.findMany({
      where: { role: 'COLLECTOR', active: true },
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

  async monthlyCollections() {
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
      LEFT JOIN payment_allocations pa ON pa.schedule_id = ps.id
      LEFT JOIN payments p ON p.id = pa.payment_id
      WHERE ps.due_date >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', ps.due_date)
      ORDER BY month ASC
    `;

    return rows.map((r) => ({
      month: r.month.toLocaleString('default', { month: 'short' }),
      collected: Number(r.collected),
      expected: Number(r.expected),
    }));
  }

  async weeklyMovement() {
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
        FROM loans
        WHERE start_date >= ${weekStart} AND start_date <= ${weekEnd}
        GROUP BY EXTRACT(ISODOW FROM start_date)::int
      ),
      closed_loans AS (
        SELECT EXTRACT(ISODOW FROM end_date)::int AS dow, COUNT(*) AS count
        FROM loans
        WHERE status = 'PAID' AND end_date IS NOT NULL
          AND end_date >= ${weekStart} AND end_date <= ${weekEnd}
        GROUP BY EXTRACT(ISODOW FROM end_date)::int
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

  async upcomingPayments(daysAhead = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + daysAhead);

    const schedules = await prisma.paymentSchedule.findMany({
      where: {
        dueDate: { gte: today, lte: future },
        status: { in: ['PENDING', 'PARTIAL'] },
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
