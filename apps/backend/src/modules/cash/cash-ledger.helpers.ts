import { BadRequestException } from '@nestjs/common';

export type CashLedgerAmount = { type: 'IN' | 'OUT'; amount: number };

export function buildCashDayRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD');
  }

  const start = new Date(`${date}T00:00:00-04:00`);
  if (
    Number.isNaN(start.getTime()) ||
    start.toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }) !== date
  ) {
    throw new BadRequestException('La fecha no es válida');
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function summarizeCashMovements(movements: CashLedgerAmount[]) {
  const totals = movements.reduce(
    (current, movement) => {
      if (movement.type === 'IN') current.income += movement.amount;
      else current.expense += movement.amount;
      return current;
    },
    { income: 0, expense: 0 },
  );

  return {
    ...totals,
    openingBalance: 0,
    balance: totals.income - totals.expense,
  };
}
