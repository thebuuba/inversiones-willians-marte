import { InvestmentsService } from './investments.service';

jest.mock('@inversiones/database', () => ({
  prisma: {},
  Prisma: {},
}));

describe('InvestmentsService', () => {
  let service: InvestmentsService;

  beforeEach(() => {
    service = new InvestmentsService();
  });

  it('calculates monthly payment from monthly percentage rate', () => {
    expect(service.calculateMonthlyPayment(100000, 3)).toBe(3000);
  });

  it('marks the current period as paid when a payment exists', () => {
    const status = service.getCurrentPeriodStatus(
      '2026-07-03',
      [{ periodMonth: 8, periodYear: 2026 }],
      new Date('2026-08-12T12:00:00.000Z'),
    );

    expect(status.paymentStatus).toBe('PAID');
    expect(status.currentPeriodMonth).toBe(8);
    expect(status.currentPeriodYear).toBe(2026);
  });

  it('marks the current period as overdue after the start-day due date passes', () => {
    const status = service.getCurrentPeriodStatus(
      '2026-07-03',
      [],
      new Date('2026-08-12T12:00:00.000Z'),
    );

    expect(status.paymentStatus).toBe('OVERDUE');
    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-08-03');
  });

  it('marks the current period as pending before the monthly due date', () => {
    const status = service.getCurrentPeriodStatus(
      '2026-07-20',
      [],
      new Date('2026-08-12T12:00:00.000Z'),
    );

    expect(status.paymentStatus).toBe('PENDING');
    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-08-20');
  });
});
