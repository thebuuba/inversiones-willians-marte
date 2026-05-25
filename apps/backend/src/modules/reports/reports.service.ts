import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';

@Injectable()
export class ReportsService {
  async dashboard() {
    const [activeLoans, totalClients, totalUsers, paymentsToday, portfolioStats] =
      await Promise.all([
        prisma.loan.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count({ where: { active: true } }),
        prisma.user.count({ where: { active: true } }),
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
      ]);

    const overdueLoans = await prisma.loan.count({
      where: {
        status: 'ACTIVE',
        schedule: {
          some: {
            status: 'OVERDUE',
          },
        },
      },
    });

    return {
      activeLoans,
      totalClients,
      totalUsers,
      collectionsToday: Number(paymentsToday._sum.amount ?? 0),
      portfolioBalance: Number(portfolioStats._sum.balance ?? 0),
      totalPrincipal: Number(portfolioStats._sum.principal ?? 0),
      overdueLoans,
      totalLoans: portfolioStats._count,
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

    const result = [];
    for (const collector of collectors) {
      const totalCollected = await prisma.payment.aggregate({
        where: { receivedById: collector.id },
        _sum: { amount: true },
      });
      result.push({
        id: collector.id,
        name: collector.name,
        paymentsCount: collector._count.receivedPayments,
        totalCollected: Number(totalCollected._sum.amount ?? 0),
      });
    }

    return result;
  }
}
