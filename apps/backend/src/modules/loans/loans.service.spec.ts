import { LoansService } from './loans.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loan: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    loanProduct: {
      findUnique: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('LoansService', () => {
  let service: LoansService;

  beforeEach(() => {
    service = new LoansService({} as any, {} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports remaining balance without subtracting payments twice', async () => {
    jest.mocked(prisma.loan.findUnique).mockResolvedValue({
      id: 'loan-1',
      totalAmount: 1000,
      balance: 700,
      schedule: [
        { status: 'PAID', dueDate: new Date('2026-05-10') },
        { status: 'PENDING', dueDate: new Date('2099-06-10') },
      ],
      payments: [{ amount: 300 }],
    } as any);

    await expect(service.getSummary('loan-1')).resolves.toMatchObject({
      totalPaid: 300,
      balance: 700,
      remaining: 700,
      progress: 30,
    });
  });

  it('loads existing late fees in loan detail', async () => {
    jest.mocked(prisma.loan.findUnique).mockResolvedValue({ id: 'loan-1' } as any);

    await service.findOne('loan-1');

    expect(prisma.loan.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          lateFees: expect.anything(),
        }),
      }),
    );
  });

  it('writes an audit event when a loan is created', async () => {
    const amortization = {
      calculate: jest.fn().mockReturnValue([
        {
          dueDate: new Date('2026-07-01'),
          amount: 1100,
          principalPart: 1000,
          interestPart: 100,
          balanceAfter: 0,
        },
      ]),
    };
    service = new LoansService(amortization as any, {} as any);
    jest.mocked(prisma.loanProduct.findUnique).mockResolvedValue({
      id: 'product-1',
      active: true,
      interestRate: 10,
      interestType: 'FIXED',
      paymentFrequency: 'MONTHLY',
      maxTerm: 12,
    } as any);
    jest.mocked(prisma.client.findUnique).mockResolvedValue({ id: 1, active: true } as any);
    jest.mocked(prisma.loan.create).mockResolvedValue({
      id: 'loan-1',
      loanNumber: 15,
      clientId: 1,
      principal: 1000,
      totalAmount: 1100,
    } as any);

    await service.create(
      {
        clientId: 1,
        productId: 'product-1',
        principal: 1000,
        term: 1,
        startDate: '2026-06-01',
      },
      'user-1',
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'LOAN_CREATED',
        entityType: 'Loan',
        entityId: 'loan-1',
        clientId: 1,
        newValues: expect.objectContaining({ loanNumber: 15, principal: 1000 }),
      }),
    });
  });
});
