import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';

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
      totalAmount: unknown;
      balance: unknown;
      status: string;
      createdAt: Date;
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
  }) {
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
      loans: loans.map((loan) => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        clientId: loan.clientId,
        principal: Number(loan.principal),
        totalAmount: Number(loan.totalAmount),
        balance: Number(loan.balance),
        status: loan.status,
        createdAt: loan.createdAt,
        client: loan.client,
        product: loan.product,
      })),
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

  async findAll() {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        _count: { select: { loans: true } },
        loans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            loanNumber: true,
            clientId: true,
            principal: true,
            totalAmount: true,
            balance: true,
            status: true,
            createdAt: true,
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
    });

    return portfolios.map((portfolio) => this.mapPortfolio(portfolio));
  }

  async findOne(id: string) {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        _count: { select: { loans: true } },
        loans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            loanNumber: true,
            clientId: true,
            principal: true,
            totalAmount: true,
            balance: true,
            status: true,
            createdAt: true,
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
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return this.mapPortfolio(portfolio);
  }

  async remove(id: string) {
    await this.findOne(id);
    await prisma.portfolio.delete({ where: { id } });
  }
}
