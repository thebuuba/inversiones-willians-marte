import { BadRequestException } from '@nestjs/common';
import { buildCashDayRange, summarizeCashMovements } from './cash-ledger.helpers';

describe('cash ledger helpers', () => {
  it('builds a Dominican calendar day using the office timezone', () => {
    const { start, end } = buildCashDayRange('2026-07-13');

    expect(start.toISOString()).toBe('2026-07-13T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-14T04:00:00.000Z');
  });

  it('rejects impossible dates instead of rolling into the next month', () => {
    expect(() => buildCashDayRange('2026-02-30')).toThrow(BadRequestException);
  });

  it('starts every daily reconciliation at zero', () => {
    expect(
      summarizeCashMovements([
        { type: 'IN', amount: 40_000 },
        { type: 'OUT', amount: 12_000 },
        { type: 'OUT', amount: 3_000 },
      ]),
    ).toEqual({ openingBalance: 0, income: 40_000, expense: 15_000, balance: 25_000 });
  });
});
