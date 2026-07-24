import { calculateLateFee } from './late-fee';

describe('calculateLateFee', () => {
  const base = {
    installmentAmount: 1000,
    dueDate: new Date('2026-07-01T00:00:00.000Z'),
    asOfDate: new Date('2026-07-09T00:00:00.000Z'),
    graceDays: 5,
    value: 5,
  };

  it('calculates one fixed fee per installment or a fee for every late day', () => {
    expect(calculateLateFee({ ...base, mode: 'PER_INSTALLMENT', calculation: 'PERCENTAGE' })).toBe(
      50,
    );
    expect(calculateLateFee({ ...base, mode: 'DAILY', calculation: 'AMOUNT', value: 10 })).toBe(30);
  });
});
