import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { CreateLoanDto } from './dto/create-loan.dto';
import { AmortizationService } from './amortization.service';

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

@Injectable()
export class LoansService {
  constructor(private amortization: AmortizationService) {}

  async create(dto: CreateLoanDto, userId: string) {
    const product = await prisma.loanProduct.findUnique({ where: { id: dto.productId } });
    if (!product || !product.active) throw new NotFoundException('Loan product not found');

    const client = await prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client || !client.active) throw new NotFoundException('Client not found');

    if (dto.term > (product.maxTerm ?? Infinity)) {
      throw new BadRequestException(`Term exceeds maximum of ${product.maxTerm}`);
    }

    const interestType = dto.amortizationType ?? product.interestType;

    const schedule = this.amortization.calculate({
      principal: dto.principal,
      interestRate: Number(product.interestRate),
      interestType,
      paymentFrequency: product.paymentFrequency,
      term: dto.term,
      startDate: new Date(dto.startDate),
    });

    const totalAmount = schedule.reduce((sum, row) => sum + row.amount, 0);
    const lastRow = schedule[schedule.length - 1];

    const balance =
      interestType === 'INDEFINITE' ? dto.principal : Math.round(totalAmount * 100) / 100;

    const loan = await prisma.loan.create({
      data: {
        clientId: dto.clientId,
        productId: dto.productId,
        principal: dto.principal,
        interestRate: product.interestRate,
        interestType,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paymentFreq: product.paymentFrequency,
        term: dto.term,
        startDate: new Date(dto.startDate),
        endDate: lastRow?.dueDate ?? null,
        balance,
        notes: dto.notes,
        portfolioId: dto.portfolioId ?? null,
        createdById: userId,
        schedule: {
          create: schedule.map((row) => ({
            dueDate: row.dueDate,
            amount: row.amount,
            principalPart: row.principalPart,
            interestPart: row.interestPart,
            balanceAfter: row.balanceAfter,
          })),
        },
      },
      include: {
        client: true,
        product: true,
        schedule: { orderBy: { dueDate: 'asc' } },
      },
    });

    await prisma.auditLog.create({
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
        },
      },
    });

    return loan;
  }

  async findAll(status?: string, search?: string, take = 50, skip = 0) {
    const pageSize = Math.min(Math.max(take, 1), 100);
    const offset = Math.max(skip, 0);
    const filters: Prisma.Sql[] = [];

    if (status) filters.push(Prisma.sql`l.status::text = ${status}`);
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
      ORDER BY l.created_at DESC
      LIMIT ${pageSize + 1}
      OFFSET ${offset}
    `;
    const hasMore = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);
    const total = hasMore
      ? Number(
          (
            await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*)::int AS count
          FROM loans l
          JOIN clients c ON c.id = l.client_id
          ${whereSql}
        `
          )[0]?.count ?? 0,
        )
      : offset + pageRows.length;

    return {
      data: pageRows.map((row) => ({
        id: row.id,
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
      })),
      total,
    };
  }

  async findOne(id: string) {
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
          include: { receivedBy: { select: { id: true, name: true } } },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
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
