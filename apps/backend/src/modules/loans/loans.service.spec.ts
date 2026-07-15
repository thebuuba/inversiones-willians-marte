import { LoansService } from './loans.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loan: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    paymentSchedule: {
      upsert: jest.fn(),
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
    $transaction: jest.fn(),
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

  it('repairs an active indefinite loan with no pending schedule when loading its detail', async () => {
    jest.mocked(prisma.loan.findUnique).mockResolvedValue({
      id: 'loan-1',
      status: 'ACTIVE',
      interestType: 'INDEFINITE',
      principal: 40000,
      interestRate: 18,
      paymentFreq: 'MONTHLY',
      startDate: new Date('2026-05-15'),
      totalAmount: 600,
      schedule: [
        {
          id: 'schedule-1',
          dueDate: new Date('2026-06-15'),
          status: 'PAID',
        },
      ],
    } as any);
    jest.mocked(prisma.paymentSchedule.upsert).mockResolvedValue({
      id: 'schedule-2',
      dueDate: new Date('2026-07-15'),
      status: 'PENDING',
    } as any);

    const result = await service.findOne('loan-1');

    expect(prisma.paymentSchedule.upsert).toHaveBeenCalledWith({
      where: {
        loanId_dueDate: { loanId: 'loan-1', dueDate: new Date('2026-07-15') },
      },
      update: {},
      create: {
        loanId: 'loan-1',
        dueDate: new Date('2026-07-15'),
        amount: 600,
        principalPart: 0,
        interestPart: 600,
        balanceAfter: 40000,
      },
    });
    expect(result.schedule).toHaveLength(2);
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

  it('does not persist an end date for an indefinite loan', async () => {
    const amortization = {
      calculate: jest.fn().mockReturnValue([
        {
          dueDate: new Date('2026-07-01'),
          amount: 100,
          principalPart: 0,
          interestPart: 100,
          balanceAfter: 1000,
        },
      ]),
    };
    service = new LoansService(amortization as any, {} as any);
    jest.mocked(prisma.loanProduct.findUnique).mockResolvedValue({
      id: 'product-1',
      active: true,
      interestRate: 12,
      interestType: 'FIXED',
      paymentFrequency: 'MONTHLY',
      maxTerm: 12,
    } as any);
    jest.mocked(prisma.client.findUnique).mockResolvedValue({ id: 1, active: true } as any);
    jest.mocked(prisma.loan.create).mockResolvedValue({
      id: 'loan-1',
      loanNumber: 20,
      clientId: 1,
      principal: 1000,
      totalAmount: 100,
    } as any);

    await service.create(
      {
        clientId: 1,
        productId: 'product-1',
        principal: 1000,
        term: 1,
        startDate: '2026-06-01',
        amortizationType: 'INDEFINITE',
      },
      'user-1',
    );

    expect(prisma.loan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ endDate: null }) }),
    );
  });

  it('uses manual loan terms when creating the persisted schedule', async () => {
    const amortization = {
      calculate: jest.fn().mockReturnValue([
        {
          dueDate: new Date('2026-07-01'),
          amount: 2000,
          principalPart: 800,
          interestPart: 1200,
          balanceAfter: 29200,
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
      loanNumber: 16,
      clientId: 1,
      principal: 30000,
      totalAmount: 2000,
    } as any);

    await service.create(
      {
        clientId: 1,
        productId: 'product-1',
        principal: 30000,
        interestRate: 4,
        term: 12,
        startDate: '2026-08-09',
        paymentFrequency: 'MONTHLY',
        customPayment: 2000,
      },
      'user-1',
    );

    expect(amortization.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        principal: 30000,
        interestRate: 48,
        paymentFrequency: 'MONTHLY',
        customPayment: 2000,
      }),
    );
    expect(prisma.loan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          interestRate: 4,
          paymentFreq: 'MONTHLY',
        }),
      }),
    );
  });

  it('adds indefinite-loan capital with atomic increments', async () => {
    const pendingSchedule = {
      id: 'schedule-1',
      dueDate: new Date('2026-08-01T00:00:00.000Z'),
      status: 'PENDING',
    };
    const tx = {
      loan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'loan-1',
          clientId: 1,
          status: 'ACTIVE',
          interestType: 'INDEFINITE',
          interestRate: 240,
          paymentFreq: 'MONTHLY',
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          principal: 1000,
          balance: 1000,
          schedule: [pendingSchedule],
          capitalMovements: [],
        }),
        update: jest.fn().mockResolvedValue({ principal: 1500, balance: 1500 }),
      },
      paymentSchedule: {
        update: jest.fn(),
        create: jest.fn(),
      },
      loanCapitalMovement: {
        create: jest.fn().mockResolvedValue({ id: 'movement-1' }),
      },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.addCapital('loan-1', { amount: 500, effectiveDate: '2026-07-13' }, 'user-1');

    expect(tx.loan.findUnique).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      include: {
        schedule: { orderBy: { dueDate: 'asc' } },
        capitalMovements: { orderBy: { effectiveDate: 'asc' } },
      },
    });
    expect(tx.loan.update).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      data: {
        principal: { increment: 500 },
        balance: { increment: 500 },
      },
      select: { principal: true, balance: true },
    });
    expect(tx.paymentSchedule.update).toHaveBeenCalledWith({
      where: { id: 'schedule-1' },
      data: {
        amount: 300,
        interestPart: 300,
        balanceAfter: 1500,
      },
    });
  });
});
