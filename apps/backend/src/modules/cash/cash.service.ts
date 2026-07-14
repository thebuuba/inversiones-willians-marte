import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@inversiones/database';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { buildCashDayRange, summarizeCashMovements } from './cash-ledger.helpers';

type CashLedgerRow = {
  id: string;
  type: 'IN' | 'OUT';
  person: string;
  code: string;
  description: string;
  amount: number;
  movementDate: Date;
  category: string;
  paymentMethod: string | null;
  affectsBalance: boolean;
  sourceType: string;
  registeredBy: string;
};

type CashAggregateRow = {
  income: number;
  expense: number;
};

function cashLedgerUnion() {
  return Prisma.sql`
    SELECT
      cm.id,
      cm.type::text AS type,
      cm.person,
      'MOV-' || UPPER(LEFT(cm.id, 6)) AS code,
      COALESCE(cm.description, 'Movimiento manual de caja') AS description,
      cm.amount::float8 AS amount,
      cm.movement_date AS "movementDate",
      cm.category,
      cm.payment_method AS "paymentMethod",
      cm.affects_balance AS "affectsBalance",
      'MANUAL' AS "sourceType",
      u.name AS "registeredBy"
    FROM cash_movements cm
    JOIN users u ON u.id = cm.created_by

    UNION ALL

    SELECT
      p.id,
      'IN' AS type,
      TRIM(c.first_name || ' ' || c.last_name) AS person,
      'PAG-' || l.loan_number::text AS code,
      COALESCE(p.notes, 'Pago del préstamo #' || l.loan_number::text) AS description,
      p.amount::float8 AS amount,
      p.payment_date AS "movementDate",
      'Pago de préstamo' AS category,
      p.payment_method AS "paymentMethod",
      TRUE AS "affectsBalance",
      'PAYMENT' AS "sourceType",
      u.name AS "registeredBy"
    FROM payments p
    JOIN clients c ON c.id = p.client_id
    JOIN loans l ON l.id = p.loan_id
    JOIN users u ON u.id = p.received_by

    UNION ALL

    SELECT
      l.id,
      'OUT' AS type,
      TRIM(c.first_name || ' ' || c.last_name) AS person,
      'PRE-' || l.loan_number::text AS code,
      'Desembolso del préstamo #' || l.loan_number::text AS description,
      (
        l.principal - COALESCE(
          (SELECT SUM(previous_lcm.amount) FROM loan_capital_movements previous_lcm WHERE previous_lcm.loan_id = l.id),
          0
        )
      )::float8 AS amount,
      l.created_at AS "movementDate",
      'Desembolso' AS category,
      NULL::text AS "paymentMethod",
      TRUE AS "affectsBalance",
      'LOAN' AS "sourceType",
      u.name AS "registeredBy"
    FROM loans l
    JOIN clients c ON c.id = l.client_id
    JOIN users u ON u.id = l.created_by

    UNION ALL

    SELECT
      lcm.id,
      'OUT' AS type,
      TRIM(c.first_name || ' ' || c.last_name) AS person,
      'PRE-' || l.loan_number::text AS code,
      COALESCE(lcm.notes, 'Capital adicional del préstamo #' || l.loan_number::text) AS description,
      lcm.amount::float8 AS amount,
      lcm.effective_date AS "movementDate",
      'Desembolso' AS category,
      NULL::text AS "paymentMethod",
      TRUE AS "affectsBalance",
      'LOAN_CAPITAL' AS "sourceType",
      u.name AS "registeredBy"
    FROM loan_capital_movements lcm
    JOIN loans l ON l.id = lcm.loan_id
    JOIN clients c ON c.id = l.client_id
    JOIN users u ON u.id = lcm.created_by

    UNION ALL

    SELECT
      ii.id,
      'IN' AS type,
      i.name AS person,
      ii.code,
      COALESCE(ii.notes, 'Capital recibido de inversionista') AS description,
      (
        ii.capital - COALESCE(
          (SELECT SUM(previous_iim.amount) FROM investor_investment_movements previous_iim WHERE previous_iim.investment_id = ii.id),
          0
        )
      )::float8 AS amount,
      ii.created_at AS "movementDate",
      'Ingreso de inversionista' AS category,
      NULL::text AS "paymentMethod",
      TRUE AS "affectsBalance",
      'INVESTMENT' AS "sourceType",
      u.name AS "registeredBy"
    FROM investor_investments ii
    JOIN investors i ON i.id = ii.investor_id
    JOIN users u ON u.id = ii.created_by
    WHERE ii.capital - COALESCE(
      (SELECT SUM(previous_iim.amount) FROM investor_investment_movements previous_iim WHERE previous_iim.investment_id = ii.id),
      0
    ) > 0

    UNION ALL

    SELECT
      iim.id,
      'IN' AS type,
      i.name AS person,
      ii.code,
      COALESCE(iim.notes, 'Capital adicional recibido de inversionista') AS description,
      iim.amount::float8 AS amount,
      iim.movement_date AS "movementDate",
      'Ingreso de inversionista' AS category,
      NULL::text AS "paymentMethod",
      TRUE AS "affectsBalance",
      'INVESTMENT_CAPITAL' AS "sourceType",
      u.name AS "registeredBy"
    FROM investor_investment_movements iim
    JOIN investor_investments ii ON ii.id = iim.investment_id
    JOIN investors i ON i.id = ii.investor_id
    JOIN users u ON u.id = iim.created_by

    UNION ALL

    SELECT
      ip.id,
      'OUT' AS type,
      i.name AS person,
      'REC-' || ip.receipt_number::text AS code,
      COALESCE(ip.notes, 'Pago de rendimiento a inversionista') AS description,
      ip.amount::float8 AS amount,
      ip.payment_date AS "movementDate",
      'Pago a inversionista' AS category,
      ip.payment_method AS "paymentMethod",
      TRUE AS "affectsBalance",
      'INVESTOR_PAYMENT' AS "sourceType",
      u.name AS "registeredBy"
    FROM investor_payments ip
    JOIN investors i ON i.id = ip.investor_id
    JOIN users u ON u.id = ip.received_by
  `;
}

@Injectable()
export class CashService {
  async findDay(date: string) {
    const { start, end } = buildCashDayRange(date);
    const ledger = cashLedgerUnion();

    const [movements, dayAggregate] = await Promise.all([
      prisma.$queryRaw<CashLedgerRow[]>`
        SELECT *
        FROM (${ledger}) ledger
        WHERE ledger."movementDate" >= ${start} AND ledger."movementDate" < ${end}
        ORDER BY ledger."movementDate" DESC, ledger.id DESC
        LIMIT 2000
      `,
      prisma.$queryRaw<CashAggregateRow[]>`
        SELECT
          COALESCE(SUM(CASE WHEN ledger."affectsBalance" AND ledger.type = 'IN' THEN ledger.amount ELSE 0 END), 0)::float8 AS income,
          COALESCE(SUM(CASE WHEN ledger."affectsBalance" AND ledger.type = 'OUT' THEN ledger.amount ELSE 0 END), 0)::float8 AS expense
        FROM (${ledger}) ledger
        WHERE ledger."movementDate" >= ${start} AND ledger."movementDate" < ${end}
      `,
    ]);

    const aggregate = dayAggregate[0] ?? { income: 0, expense: 0 };
    const totals = summarizeCashMovements([
      { type: 'IN', amount: Number(aggregate.income) },
      { type: 'OUT', amount: Number(aggregate.expense) },
    ]);

    return {
      date,
      movements: movements.map((movement) => ({
        ...movement,
        amount: Number(movement.amount),
      })),
      totals,
    };
  }

  async createManual(dto: CreateCashMovementDto, userId: string) {
    const person = dto.person.trim();
    const category =
      dto.category?.trim() || (dto.type === 'IN' ? 'Entrada manual' : 'Salida manual');
    if (!person) {
      throw new BadRequestException('La persona o concepto es obligatorio');
    }

    return prisma.$transaction(async (tx) => {
      const movement = await tx.cashMovement.create({
        data: {
          type: dto.type,
          person,
          amount: dto.amount,
          movementDate: new Date(dto.movementDate),
          category,
          paymentMethod: dto.paymentMethod?.trim() || null,
          description: dto.description?.trim() || null,
          affectsBalance: dto.affectsBalance ?? true,
          createdById: userId,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CASH_MOVEMENT_CREATED',
          entityType: 'CashMovement',
          entityId: movement.id,
          newValues: {
            type: dto.type,
            person,
            amount: dto.amount,
            movementDate: dto.movementDate,
            category,
            affectsBalance: dto.affectsBalance ?? true,
          },
        },
      });
      return movement;
    });
  }
}
