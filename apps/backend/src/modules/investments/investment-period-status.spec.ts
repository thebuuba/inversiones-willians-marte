import { getInvestmentPeriodStatus } from './investment-period-status';

describe('getInvestmentPeriodStatus', () => {
  const startDate = '2026-01-20T00:00:00.000Z';

  it.each([
    ['2026-08-14T12:00:00.000Z', 'SCHEDULED'],
    ['2026-08-15T12:00:00.000Z', 'UPCOMING'],
    ['2026-08-19T12:00:00.000Z', 'UPCOMING'],
    ['2026-08-20T12:00:00.000Z', 'PENDING'],
    ['2026-08-25T12:00:00.000Z', 'PENDING'],
    ['2026-08-26T12:00:00.000Z', 'OVERDUE'],
  ] as const)('classifies %s as %s', (today, expected) => {
    expect(getInvestmentPeriodStatus(startDate, [], new Date(today)).paymentStatus).toBe(expected);
  });

  it('advances to the next month and stays scheduled after the current payment', () => {
    const status = getInvestmentPeriodStatus(
      startDate,
      [{ periodMonth: 8, periodYear: 2026 }],
      new Date('2026-08-20T12:00:00.000Z'),
    );

    expect(status.paymentStatus).toBe('SCHEDULED');
    expect(status.currentPeriodMonth).toBe(9);
    expect(status.currentPeriodYear).toBe(2026);
    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-09-20');
  });

  it('skips consecutive paid periods', () => {
    const status = getInvestmentPeriodStatus(
      startDate,
      [
        { periodMonth: 8, periodYear: 2026 },
        { periodMonth: 9, periodYear: 2026 },
      ],
      new Date('2026-08-20T12:00:00.000Z'),
    );

    expect(status.paymentStatus).toBe('SCHEDULED');
    expect(status.currentPeriodMonth).toBe(10);
    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-10-20');
  });

  it('clamps monthly due dates to the final day of shorter months', () => {
    const status = getInvestmentPeriodStatus(
      '2026-01-31T00:00:00.000Z',
      [],
      new Date('2026-02-23T12:00:00.000Z'),
    );

    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(status.paymentStatus).toBe('UPCOMING');
  });
});
