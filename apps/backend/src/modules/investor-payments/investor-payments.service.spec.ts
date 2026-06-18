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
  },
}));

describe('InvestorPaymentsService', () => {
  let service: InvestorPaymentsService;

  beforeEach(() => {
    service = new InvestorPaymentsService({} as InvestmentsService);
    jest.mocked(prisma.investorInvestment.findUnique).mockResolvedValue({
      id: 'investment-1',
      investorId: 'investor-1',
    } as never);
    jest.mocked(prisma.investorPayment.findFirst).mockResolvedValue({ receiptNumber: 9 } as never);
    jest.mocked(prisma.investorPayment.create).mockResolvedValue({
      id: 'payment-2',
      investmentId: 'investment-1',
      investorId: 'investor-1',
      receiptNumber: 10,
      periodMonth: 7,
      periodYear: 2026,
    } as never);
  });

  afterEach(() => {
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
});
