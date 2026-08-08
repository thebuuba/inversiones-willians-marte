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

  it('keeps the current period paid when its payment exists', () => {
    expect(
      getInvestmentPeriodStatus(
        startDate,
        [{ periodMonth: 8, periodYear: 2026 }],
        new Date('2026-08-26T12:00:00.000Z'),
      ).paymentStatus,
    ).toBe('PAID');
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
