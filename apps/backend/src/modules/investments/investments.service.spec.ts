import { InvestmentsService } from './investments.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    investor: {
      findUnique: jest.fn(),
    },
    investorInvestment: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  Prisma: {},
}));

describe('InvestmentsService', () => {
  let service: InvestmentsService;

  beforeEach(() => {
    service = new InvestmentsService();
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma));
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

  it('uses the first investment period when the investment starts in the future', () => {
    const status = service.getCurrentPeriodStatus(
      '2026-07-09',
      [{ periodMonth: 7, periodYear: 2026 }],
      new Date('2026-06-12T12:00:00.000Z'),
    );

    expect(status.paymentStatus).toBe('PAID');
    expect(status.currentPeriodMonth).toBe(7);
    expect(status.currentPeriodYear).toBe(2026);
    expect(status.nextDueDate?.toISOString().slice(0, 10)).toBe('2026-07-09');
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

  it('writes an audit event when an investment is created', async () => {
    jest
      .mocked(prisma.investor.findUnique)
      .mockResolvedValue({ id: 'investor-1', code: 'INV-001' } as any);
    jest.mocked(prisma.investorInvestment.count).mockResolvedValue(0);
    jest.mocked(prisma.investorInvestment.create).mockResolvedValue({
      id: 'investment-1',
      investorId: 'investor-1',
      code: 'INV-001-01',
      capital: 100000,
      monthlyPayment: 3000,
      rate: 3,
      startDate: null,
      payments: [],
      movements: [],
      investor: {},
    } as any);

    await service.create('investor-1', { capital: 100000, rate: 3 }, 'user-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'INVESTMENT_CREATED',
        entityType: 'InvestorInvestment',
        entityId: 'investment-1',
        newValues: expect.objectContaining({ investorId: 'investor-1', capital: 100000 }),
      }),
    });
  });

  it('writes an audit event when capital is added to an investment', async () => {
    const tx = {
      investorInvestment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'investment-1',
          investorId: 'investor-1',
          capital: 100000,
          rate: 3,
          status: 'ACTIVE',
        }),
        update: jest
          .fn()
          .mockResolvedValueOnce({ capital: 150000, rate: 3 })
          .mockResolvedValueOnce({}),
      },
      investorInvestmentMovement: {
        create: jest.fn().mockResolvedValue({ id: 'movement-1' }),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'investment-1' } as any);

    await service.addCapital(
      'investment-1',
      { amount: 50000, movementDate: '2026-06-18' },
      'user-1',
    );

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'INVESTMENT_CAPITAL_ADDED',
        entityType: 'InvestorInvestmentMovement',
        entityId: 'movement-1',
        newValues: expect.objectContaining({
          investmentId: 'investment-1',
          previousCapital: 100000,
          nextCapital: 150000,
        }),
      }),
    });
    expect(tx.investorInvestment.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'investment-1' },
      data: { capital: { increment: 50000 } },
      select: { capital: true, rate: true },
    });
    expect(tx.investorInvestment.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'investment-1' },
      data: { monthlyPayment: 4500 },
    });
  });
});
