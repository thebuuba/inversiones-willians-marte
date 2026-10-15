import { InvestorPaymentsService } from './investor-payments.service';
import { prisma } from '@inversiones/database';
import { InvestmentsService } from '../investments/investments.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    investorPayment: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    investorInvestment: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('InvestorPaymentsService', () => {
  let service: InvestorPaymentsService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-12T12:00:00Z'));
    service = new InvestorPaymentsService({} as InvestmentsService);
    jest.mocked(prisma.investorInvestment.findUnique).mockResolvedValue({
      id: 'investment-1',
      investorId: 'investor-1',
      status: 'ACTIVE',
      startDate: new Date('2026-06-12'),
      createdAt: new Date('2026-06-12'),
      monthlyPayment: 3000,
      rate: 3,
      payments: [],
      movements: [],
    } as never);
    jest.mocked(prisma.investorPayment.findFirst).mockResolvedValue({ receiptNumber: 9 } as never);
    jest.mocked(prisma.investorPayment.create).mockImplementation(
      (args) =>
        Promise.resolve({
          ...args.data,
          id: 'payment-2',
          investmentId: 'investment-1',
          investorId: 'investor-1',
          receiptNumber: 10,
          periodMonth: 7,
          periodYear: 2026,
        }) as never,
    );
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        investorInvestment: prisma.investorInvestment,
        investorPayment: prisma.investorPayment,
        auditLog: prisma.auditLog,
      } as never),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('allows another payment for the same investment period', async () => {
    const payment = await service.create(
      {
        investmentId: 'investment-1',
        amount: 3000,
        periodMonth: 7,
        periodYear: 2026,
        paymentDate: '2026-07-12',
      },
      'user-1',
    );

    expect(payment.receiptNumber).toBe(10);
    expect(prisma.investorPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          investmentId: 'investment-1',
          investorId: 'investor-1',
          periodMonth: 7,
          periodYear: 2026,
          receivedById: 'user-1',
        }),
      }),
    );
  });

  it('writes an audit event when an investor payment is created', async () => {
    await service.create(
      {
        investmentId: 'investment-1',
        amount: 3000,
        periodMonth: 7,
        periodYear: 2026,
        paymentDate: '2026-07-12',
      },
      'user-1',
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'INVESTOR_PAYMENT_CREATED',
        entityType: 'InvestorPayment',
        entityId: 'payment-2',
        newValues: expect.objectContaining({
          investmentId: 'investment-1',
          investorId: 'investor-1',
          amount: 3000,
        }),
      }),
    });
  });
  it('rejects an amount greater than all interest currently due', async () => {
    await expect(
      service.create(
        {
          investmentId: 'investment-1',
          amount: 3000.01,
          periodMonth: 7,
          periodYear: 2026,
          paymentDate: '2026-07-12',
        },
        'user-1',
      ),
    ).rejects.toThrow(/pendiente/);
    expect(prisma.investorPayment.create).not.toHaveBeenCalled();
  });
  it('rejects stale periods rather than charging an already settled month again', async () => {
    await expect(
      service.create(
        {
          investmentId: 'investment-1',
          amount: 100,
          periodMonth: 6,
          periodYear: 2026,
          paymentDate: '2026-07-12',
        },
        'user-1',
      ),
    ).rejects.toThrow(/período/);
  });
  it('rejects a payment belonging to another investor', async () => {
    await expect(
      service.create(
        {
          investmentId: 'investment-1',
          investorId: 'other',
          amount: 100,
          periodMonth: 7,
          periodYear: 2026,
          paymentDate: '2026-07-12',
        },
        'user-1',
      ),
    ).rejects.toThrow(/inversionista/);
  });
  it('records one receipt with allocations for two missed months', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-12T12:00:00Z'));
    const payment = await service.create(
      {
        investmentId: 'investment-1',
        amount: 6000,
        periodMonth: 7,
        periodYear: 2026,
        paymentDate: '2026-08-12',
      },
      'user-1',
    );
    expect(payment).toMatchObject({
      allocations: [
        { periodMonth: 7, periodYear: 2026, amount: 3000 },
        { periodMonth: 8, periodYear: 2026, amount: 3000 },
      ],
    });
    expect(prisma.investorPayment.create).toHaveBeenCalledTimes(1);
  });
  it('returns the same receipt on a retried request without inserting twice', async () => {
    jest.mocked(prisma.investorPayment.findFirst).mockResolvedValue({
      id: 'already-saved',
      investmentId: 'investment-1',
      amount: 3000,
      paymentDate: new Date('2026-07-12'),
      periodMonth: 7,
      periodYear: 2026,
      receiptNumber: 10,
    } as never);
    const payment = await service.create(
      {
        requestId: 'c7d6d194-fc45-4d1b-9b17-5c8a3287b7b4',
        investmentId: 'investment-1',
        amount: 3000,
        periodMonth: 7,
        periodYear: 2026,
        paymentDate: '2026-07-12',
      },
      'user-1',
    );
    expect(payment.id).toBe('already-saved');
    expect(prisma.investorPayment.create).not.toHaveBeenCalled();
  });
  it('preserves the bank reference when using retry protection', async () => {
    jest.mocked(prisma.investorPayment.findFirst).mockResolvedValueOnce(null);
    const payment = await service.create(
      {
        requestId: 'c7d6d194-fc45-4d1b-9b17-5c8a3287b7b4',
        reference: 'BANK-123',
        investmentId: 'investment-1',
        amount: 3000,
        periodMonth: 7,
        periodYear: 2026,
        paymentDate: '2026-07-12',
      },
      'user-1',
    );
    expect(payment.reference).toBe('BANK-123');
  });
});
