import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { getLoanCollectionStatus } from '../../common/loan-collection-status';

@Injectable()
export class PortfoliosService {
  private mapPortfolio(portfolio: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { loans: number };
    loans?: Array<{
      id: string;
      loanNumber: number;
      clientId: number;
      principal: unknown;
      interestRate: unknown;
      interestType: string;
      totalAmount: unknown;
      balance: unknown;
      status: string;
      endDate: Date | null;
      createdAt: Date;
      schedule: Array<{
        dueDate: Date;
        amount: unknown;
        paidAmount: unknown;
        status: string;
      }>;
      client: {
        id: number;
        firstName: string;
        lastName: string;
        identification: string | null;
        phone: string | null;
      };
      product: {
        id: string;
        name: string;
      };
    }>;
  }, graceDays = 5) {
    const loans = portfolio.loans ?? [];

    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      color: portfolio.color,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      _count: portfolio._count,
      totals: {
        principal: loans.reduce((sum, loan) => sum + Number(loan.principal), 0),
        balance: loans.reduce((sum, loan) => sum + Number(loan.balance), 0),
      },
      loans: loans.map((loan) => {
        const nextPayment = loan.schedule[0] ?? null;
        const overdue = loan.schedule.filter(
          (item) => item.status === 'OVERDUE' || item.status === 'PARTIAL',
        );
        const amountToCollect = (overdue.length > 0 ? overdue : nextPayment ? [nextPayment] : [])
          .reduce(
            (sum, item) =>
              sum + Math.max(0, Number(item.amount) - Number(item.paidAmount ?? 0)),
            0,
          );

        return {
          id: loan.id,
          loanNumber: loan.loanNumber,
          clientId: loan.clientId,
          principal: Number(loan.principal),
          interestRate: Number(loan.interestRate),
          interestType: loan.interestType,
          totalAmount: Number(loan.totalAmount),
          balance: Number(loan.balance),
          status: loan.status,
          collectionStatus: getLoanCollectionStatus(loan, graceDays),
          createdAt: loan.createdAt,
          nextPaymentDate: nextPayment?.dueDate ?? null,
          amountToCollect,
          client: loan.client,
          product: loan.product,
        };
      }),
    };
  }

  async create(dto: CreatePortfolioDto, userId: string) {
    return prisma.portfolio.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? '#5FA37D',
        createdById: userId,
      },
    });
  }

  async findAll(take = 100, skip = 0) {
    const [settings, portfolios] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { id: 1 } }),
      prisma.portfolio.findMany({
      include: {
        _count: { select: { loans: true } },
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            loanNumber: true,
            clientId: true,
            principal: true,
            interestRate: true,
            interestType: true,
            totalAmount: true,
            balance: true,
            status: true,
            endDate: true,
            createdAt: true,
            schedule: {
              where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
              orderBy: { dueDate: 'asc' },
              select: { dueDate: true, amount: true, paidAmount: true, status: true },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                identification: true,
                phone: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      }),
    ]);

    return portfolios.map((portfolio) => this.mapPortfolio(portfolio, settings?.graceDays ?? 5));
  }

  async findOne(id: string) {
    const [settings, portfolio] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { id: 1 } }),
      prisma.portfolio.findUnique({
      where: { id },
      include: {
        _count: { select: { loans: true } },
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            loanNumber: true,
            clientId: true,
            principal: true,
            interestRate: true,
            interestType: true,
            totalAmount: true,
            balance: true,
            status: true,
            endDate: true,
            createdAt: true,
            schedule: {
              where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
              orderBy: { dueDate: 'asc' },
              select: { dueDate: true, amount: true, paidAmount: true, status: true },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                identification: true,
                phone: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      }),
    ]);
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return this.mapPortfolio(portfolio, settings?.graceDays ?? 5);
  }

  async remove(id: string, userId?: string) {
    const portfolio = await this.findOne(id);
    await prisma.portfolio.delete({ where: { id } });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PORTFOLIO_DELETED',
          entityType: 'Portfolio',
          entityId: id,
          oldValues: { name: portfolio.name },
        },
      });
    }
  }
}
