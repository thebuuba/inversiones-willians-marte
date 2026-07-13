import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuditService } from '../audit/audit.service';
import { formatPersonName } from '../../common/text/name-case';
import { normalizePagination } from '../../common/pagination';

type ClientLoanRow = {
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
  productName: string;
  productInterestType: string;
  productInterestRate: number;
  productPaymentFrequency: string;
  portfolioId: string | null;
  portfolioName: string | null;
  paymentsCount: number;
  schedule: Array<{
    dueDate: string;
    status: string;
    amount: number;
    paidAmount: number | null;
  }>;
};

type ClientNote = {
  id: string | number;
  text: string;
};

type ClientNameFields = {
  firstName: string;
  lastName: string;
};

@Injectable()
export class ClientsService {
  constructor(private audit: AuditService) {}

  async create(dto: CreateClientDto, userId: string) {
    return prisma.client.create({
      data: {
        ...dto,
        firstName: formatPersonName(dto.firstName),
        lastName: formatPersonName(dto.lastName),
        createdById: userId,
      },
    });
  }

  async findAll(search?: string, take = 50, skip = 0) {
    const pagination = normalizePagination(take, skip);
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { identification: { contains: search } },
          ],
        }
      : {};

    const fullWhere = { ...where, active: true };
    const recentThreshold = new Date(Date.now() - 30 * 86400000);

    const [data, total, activeTotal, withoutLoans, recent] = await Promise.all([
      prisma.client.findMany({
        where: fullWhere,
        include: { _count: { select: { loans: true } } },
        orderBy: { createdAt: 'desc' },
        take: pagination.take,
        skip: pagination.skip,
      }),
      prisma.client.count({ where: fullWhere }),
      prisma.client.count({ where: { active: true } }),
      prisma.client.count({ where: { active: true, loans: { none: {} } } }),
      prisma.client.count({ where: { active: true, createdAt: { gte: recentThreshold } } }),
    ]);

    return {
      data: data.map(formatClientNames),
      total,
      stats: {
        total: activeTotal,
        active: activeTotal,
        withoutLoans,
        recent,
      },
    };
  }

  async findBasic(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identification: true,
        phone: true,
        active: true,
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return formatClientNames(client);
  }

  async findOne(id: number) {
    const [client, loans] = await Promise.all([
      prisma.client.findUnique({ where: { id } }),
      prisma.$queryRaw<ClientLoanRow[]>`
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
          lp.name AS "productName",
          lp.interest_type::text AS "productInterestType",
          lp.interest_rate::float8 AS "productInterestRate",
          lp.payment_frequency::text AS "productPaymentFrequency",
          pf.id AS "portfolioId",
          pf.name AS "portfolioName",
          COUNT(DISTINCT p.id)::int AS "paymentsCount",
          COALESCE(
            JSONB_AGG(
              DISTINCT JSONB_BUILD_OBJECT(
                'dueDate', ps.due_date,
                'status', ps.status::text,
                'amount', ps.amount::float8,
                'paidAmount', ps."paidAmount"::float8
              )
            ) FILTER (WHERE ps.id IS NOT NULL),
            '[]'::jsonb
          ) AS schedule
        FROM loans l
        JOIN loan_products lp ON lp.id = l.product_id
        LEFT JOIN portfolios pf ON pf.id = l.portfolio_id
        LEFT JOIN payments p ON p.loan_id = l.id
        LEFT JOIN payment_schedule ps ON ps.loan_id = l.id
        WHERE l.client_id = ${id}
        GROUP BY l.id, lp.id, pf.id
        ORDER BY l.created_at DESC
      `,
    ]);
    if (!client) throw new NotFoundException('Client not found');
    return {
      ...formatClientNames(client),
      loans: loans.map((loan) => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        clientId: loan.clientId,
        productId: loan.productId,
        principal: loan.principal,
        interestRate: loan.interestRate,
        interestType: loan.interestType,
        totalAmount: loan.totalAmount,
        paymentFreq: loan.paymentFreq,
        term: loan.term,
        startDate: loan.startDate,
        endDate: loan.endDate,
        status: loan.status,
        balance: loan.balance,
        notes: loan.notes,
        product: {
          id: loan.productId,
          name: loan.productName,
          interestType: loan.productInterestType,
          interestRate: loan.productInterestRate,
          paymentFrequency: loan.productPaymentFrequency,
        },
        portfolio: loan.portfolioId ? { id: loan.portfolioId, name: loan.portfolioName } : null,
        schedule: loan.schedule
          .map((row) => ({
            dueDate: row.dueDate,
            status: row.status,
            amount: row.amount,
            paidAmount: row.paidAmount,
          }))
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        _count: { payments: loan.paymentsCount },
      })),
    };
  }

  async update(id: number, dto: UpdateClientDto, userId?: string) {
    const previous = await this.findOne(id);
    const data = { ...dto };
    if (dto.firstName !== undefined) data.firstName = formatPersonName(dto.firstName);
    if (dto.lastName !== undefined) data.lastName = formatPersonName(dto.lastName);
    const updated = await prisma.client.update({ where: { id }, data });

    if (userId) {
      const changes = (Object.entries(data) as Array<[string, unknown]>)
        .filter(
          ([field, value]) =>
            field !== 'notes' && previous[field as keyof typeof previous] !== value,
        )
        .map(([field, value]) => ({
          field,
          before: previous[field as keyof typeof previous] ?? null,
          after: value ?? null,
        }));

      if (changes.length > 0) {
        await this.audit.log({
          userId,
          clientId: id,
          entityType: 'Client',
          entityId: String(id),
          action: 'CLIENT_UPDATED',
          newValues: { changes },
        });
      }

      if (data.notes !== undefined && data.notes !== previous.notes) {
        await this.logNoteChanges(id, userId, previous.notes, data.notes);
      }
    }

    return updated;
  }

  private async logNoteChanges(
    clientId: number,
    userId: string,
    previousNotes?: string | null,
    nextNotes?: string | null,
  ) {
    const parse = (value?: string | null): ClientNote[] => {
      try {
        const notes: unknown = value ? JSON.parse(value) : [];
        return Array.isArray(notes) ? notes.filter(isClientNote) : [];
      } catch {
        return [];
      }
    };
    const previous = parse(previousNotes);
    const next = parse(nextNotes);
    const previousById = new Map(previous.map((note) => [note.id, note]));
    const nextById = new Map(next.map((note) => [note.id, note]));

    for (const note of next) {
      const oldNote = previousById.get(note.id);
      if (!oldNote) {
        await this.audit.log({
          userId,
          clientId,
          entityType: 'ClientNote',
          entityId: String(note.id),
          action: 'NOTE_CREATED',
        });
      } else if (oldNote.text !== note.text) {
        await this.audit.log({
          userId,
          clientId,
          entityType: 'ClientNote',
          entityId: String(note.id),
          action: 'NOTE_UPDATED',
        });
      }
    }
    for (const note of previous) {
      if (!nextById.has(note.id)) {
        await this.audit.log({
          userId,
          clientId,
          entityType: 'ClientNote',
          entityId: String(note.id),
          action: 'NOTE_DELETED',
        });
      }
    }
  }

  async remove(id: number, userId?: string) {
    const previous = await this.findOne(id);
    const updated = await prisma.client.update({ where: { id }, data: { active: false } });

    if (userId) {
      await this.audit.log({
        userId,
        clientId: id,
        entityType: 'Client',
        entityId: String(id),
        action: 'CLIENT_DELETED',
        oldValues: { active: previous.active },
        newValues: { active: false },
      });
    }

    return updated;
  }
}

function formatClientNames<T extends ClientNameFields>(client: T): T {
  return {
    ...client,
    firstName: formatPersonName(client.firstName),
    lastName: formatPersonName(client.lastName),
  };
}

function isClientNote(value: unknown): value is ClientNote {
  if (typeof value !== 'object' || value === null) return false;
  const note = value as { id?: unknown; text?: unknown };
  return (
    (typeof note.id === 'string' || typeof note.id === 'number') && typeof note.text === 'string'
  );
}
