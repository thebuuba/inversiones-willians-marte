import { getInvestmentPeriodStatus } from './investment-period-status';

describe('accumulated investment interest', () => {
  it('accumulates two unpaid months without compounding', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-03-15T12:00:00Z'),
      15000,
    );
    expect(status).toMatchObject({
      currentPeriodMonth: 2,
      pendingAmount: 30000,
      pendingMonths: 2,
      currentPeriodBalance: 15000,
    });
    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-02-15');
  });
  it('starts interest after a complete month', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-01-15T12:00:00Z'),
      15000,
    );
    expect(status).toMatchObject({ currentPeriodMonth: 2, pendingAmount: 0, pendingMonths: 0 });
  });
  it('allocates an accumulated payment across months and preserves a partial balance', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [{ id: 'payment-1', periodMonth: 2, periodYear: 2026, amount: 20000 }],
      new Date('2026-03-15T12:00:00Z'),
      15000,
    );
    expect(status).toMatchObject({
      currentPeriodMonth: 3,
      pendingAmount: 10000,
      pendingMonths: 1,
      currentPeriodBalance: 10000,
    });
    expect(status.paymentAllocations['payment-1']).toEqual([
      { periodMonth: 2, periodYear: 2026, amount: 15000 },
      { periodMonth: 3, periodYear: 2026, amount: 5000 },
    ]);
  });
  it('keeps cent precision when partial payments settle a month', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-31',
      [
        { periodMonth: 2, periodYear: 2026, amount: 100.1 },
        { periodMonth: 2, periodYear: 2026, amount: 50.25 },
      ],
      new Date('2026-03-31T12:00:00Z'),
      150.35,
    );
    expect(status).toMatchObject({
      currentPeriodMonth: 3,
      pendingAmount: 150.35,
      pendingMonths: 1,
    });
  });
  it('does not revise earlier interest when capital is added later', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-04-15T12:00:00Z'),
      18000,
      {
        rate: 3,
        capital: 600000,
        movements: [{ amount: 100000, movementDate: '2026-03-01' }],
      },
    );
    expect(status.pendingPeriods.map((period) => period.amount)).toEqual([15000, 15000, 18000]);
    expect(status.pendingAmount).toBe(48000);
  });
});

describe('office calendar boundaries', () => {
  it('does not accrue the next month early at UTC midnight', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-03-15T02:00:00Z'),
      15000,
    );
    expect(status.pendingAmount).toBe(15000);
  });
});

describe('capital addition accuracy', () => {
  it('rounds only once after reconstructing historical capital', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-03-15T12:00:00Z'),
      6000.03,
      { capital: 200001, rate: 3, movements: [{ amount: 100000.5, movementDate: '2026-03-01' }] },
    );
    expect(status.pendingPeriods.map((period) => period.amount)).toEqual([3000.02, 3000.02]);
  });
  it('gives a new contribution a complete month before including its interest', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-04-15T12:00:00Z'),
      18000,
      { capital: 600000, rate: 3, movements: [{ amount: 100000, movementDate: '2026-03-14' }] },
    );
    expect(status.pendingPeriods.map((period) => period.amount)).toEqual([15000, 15000, 18000]);
  });
});

describe('legacy contracts and integer capital', () => {
  it('preserves an agreed legacy monthly amount', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-02-15T12:00:00Z'),
      100,
      { capital: 10000, rate: 3 },
    );
    expect(status.pendingAmount).toBe(100);
  });
  it('returns safely for a zero-interest contract', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-02-15T12:00:00Z'),
      0,
      { capital: 100000, rate: 0 },
    );
    expect(status.pendingAmount).toBe(0);
    expect(status.nextDueDate).toBeNull();
  });
  it('subtracts additions in integer cents', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-15',
      [],
      new Date('2026-03-15T12:00:00Z'),
      100.01,
      { capital: 1000.06, rate: 10, movements: [{ amount: 1000.01, movementDate: '2026-03-01' }] },
    );
    expect(status.pendingPeriods.map((period) => period.amount)).toEqual([0.01, 0.01]);
  });
});
