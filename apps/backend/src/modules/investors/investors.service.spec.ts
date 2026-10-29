import { InvestorsService } from './investors.service';
import { prisma, Prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    investorPayment: { groupBy: jest.fn(), aggregate: jest.fn(), count: jest.fn() },
    investorInvestmentMovement: { count: jest.fn() },
    document: { updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
    investor: {
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    investorInvestment: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, { code }: { code: string }) {
        super(message);
        this.code = code;
      }
    },
  },
}));

describe('InvestorsService', () => {
  let service: InvestorsService;

  const dto = {
    name: 'inversionista nuevo',
    capital: 10000,
    monthlyPayment: 100,
    rate: 3,
    startDate: '2026-07-10',
  };

  beforeEach(() => {
    service = new InvestorsService();
    jest
      .mocked(prisma.investorPayment.aggregate)
      .mockResolvedValue({ _sum: { amount: 0 } } as never);
    jest.mocked(prisma.investorInvestment.count).mockResolvedValue(0);
    jest.mocked(prisma.investorPayment.count).mockResolvedValue(0);
    jest.mocked(prisma.investorInvestmentMovement.count).mockResolvedValue(0);
    jest.mocked(prisma.investorInvestment.findFirst).mockResolvedValue({
      id: 'investment-1',
      capital: 10000,
      rate: 3,
      monthlyPayment: 300,
      startDate: new Date('2026-07-10'),
      payments: [],
      movements: [],
    } as never);
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        investor: prisma.investor,
        investorInvestment: prisma.investorInvestment,
        investorPayment: prisma.investorPayment,
        investorInvestmentMovement: prisma.investorInvestmentMovement,
        document: prisma.document,
        auditLog: prisma.auditLog,
      } as never),
    );
    jest.mocked(prisma.investor.findUnique).mockResolvedValue({
      id: 'investor-6',
      investments: [
        {
          id: 'investment-1',
          capital: 10000,
          monthlyPayment: 100,
          rate: 3,
          status: 'ACTIVE',
        },
      ],
    } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('adds complete lifetime and calendar-year payment totals to investor cards', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-01-01T02:00:00Z'));
    jest.mocked(prisma.investor.findMany).mockResolvedValue([
      { id: 'investor-1', investments: [] },
      { id: 'investor-2', investments: [] },
    ] as never);
    jest
      .mocked(prisma.investorPayment.groupBy)
      .mockResolvedValueOnce([{ investorId: 'investor-1', _sum: { amount: 9000 } }] as never)
      .mockResolvedValueOnce([{ investorId: 'investor-1', _sum: { amount: 3000 } }] as never);
    const result = await service.findAll();
    expect(result[0]).toMatchObject({ totalGainsPaid: 9000, yearGainsPaid: 3000 });
    expect(result[1]).toMatchObject({ totalGainsPaid: 0, yearGainsPaid: 0 });
    expect(prisma.investorPayment.groupBy).toHaveBeenLastCalledWith({
      by: ['investorId'],
      where: {
        investorId: { in: ['investor-1', 'investor-2'] },
        paymentDate: {
          gte: new Date('2026-01-01T00:00:00-04:00'),
          lt: new Date('2027-01-01T00:00:00-04:00'),
        },
      },
      _sum: { amount: true },
    });
  });

  it('creates the next investor code from the highest existing code instead of row count', async () => {
    jest.mocked(prisma.investor.count).mockResolvedValue(2);
    jest.mocked(prisma.investor.findFirst).mockResolvedValue({ code: 'INV-0005' } as never);
    jest
      .mocked(prisma.investor.create)
      .mockResolvedValue({ id: 'investor-6', code: 'INV-0006' } as never);

    await service.create(dto, 'user-1');

    expect(prisma.investor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'INV-0006', name: 'Inversionista Nuevo' }),
      }),
    );
    expect(prisma.investorInvestment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ investorId: 'investor-6', code: 'INV-0006-01' }),
      }),
    );
  });

  it('recalculates the next code when a concurrent create takes the first candidate', async () => {
    jest
      .mocked(prisma.investor.findFirst)
      .mockResolvedValueOnce({ code: 'INV-0005' } as never)
      .mockResolvedValueOnce({ code: 'INV-0006' } as never);
    jest
      .mocked(prisma.investor.create)
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.5.0',
        }),
      )
      .mockResolvedValueOnce({ id: 'investor-7', code: 'INV-0007' } as never);
    jest.mocked(prisma.investor.findUnique).mockResolvedValue({
      id: 'investor-7',
      investments: [
        {
          id: 'investment-2',
          capital: 10000,
          monthlyPayment: 100,
          rate: 3,
          status: 'ACTIVE',
        },
      ],
    } as never);

    await service.create(dto, 'user-1');

    expect(prisma.investor.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ code: 'INV-0006' }),
      }),
    );
    expect(prisma.investor.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ code: 'INV-0007' }),
      }),
    );
  });

  it('decorates investor investments with the current payment status', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-12T12:00:00.000Z'));
    jest.mocked(prisma.investor.findUnique).mockResolvedValue({
      id: 'investor-8',
      capital: 100000,
      monthlyPayment: 3000,
      rate: 3,
      startDate: new Date('2026-07-09T00:00:00.000Z'),
      term: '12m',
      investments: [
        {
          id: 'investment-8',
          investorId: 'investor-8',
          code: 'INV-0008-01',
          capital: 100000,
          monthlyPayment: 3000,
          rate: 3,
          startDate: new Date('2026-07-09T00:00:00.000Z'),
          term: '12m',
          status: 'ACTIVE',
          payments: [{ periodMonth: 7, periodYear: 2026, amount: 3000 }],
        },
      ],
    } as never);

    const investor = await service.findOne('investor-8');

    expect(investor.investments[0].paymentStatus).toBe('SCHEDULED');
    expect(investor.investments[0].currentPeriodMonth).toBe(8);
    expect(investor.investments[0].currentPeriodYear).toBe(2026);
    expect(investor.investments[0].nextDueDate?.toISOString().slice(0, 10)).toBe('2026-08-09');
  });
  it('recalculates monthly interest when changing a new investment rate', async () => {
    await service.update('investor-6', { rate: 4 });
    expect(prisma.investorInvestment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ monthlyPayment: 400, rate: 4 }) }),
    );
  });
  it('does not rewrite terms after financial history exists', async () => {
    jest.mocked(prisma.investorInvestment.findFirst).mockResolvedValue({
      id: 'investment-1',
      capital: 10000,
      rate: 3,
      monthlyPayment: 300,
      startDate: new Date('2026-07-10'),
      payments: [{ id: 'payment-1' }],
      movements: [],
    } as never);
    await expect(service.update('investor-6', { rate: 4 })).rejects.toThrow(/historial/);
    expect(prisma.investorInvestment.update).not.toHaveBeenCalled();
  });
  it('uses complete payment totals for the state of account, including historical receipts', async () => {
    jest
      .mocked(prisma.investorPayment.aggregate)
      .mockResolvedValue({ _sum: { amount: 59000 } } as never);
    expect(await service.findOne('investor-6')).toMatchObject({ totalGainsPaid: 59000 });
  });

  it('rejects deletion when an investment exists even without payment or movement rows', async () => {
    jest.mocked(prisma.investorInvestment.count).mockResolvedValue(1);
    await expect(service.remove('investor-6', 'admin-1')).rejects.toThrow(/inversiones registradas/);
    expect(prisma.investor.delete).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('rejects deleting an investor who has payment history', async () => {
    jest.mocked(prisma.investorPayment.count).mockResolvedValue(1);
    await expect(service.remove('investor-6', 'admin-1')).rejects.toThrow(/historial de pagos/);
    expect(prisma.investorInvestment.deleteMany).not.toHaveBeenCalled();
    expect(prisma.investor.delete).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('rejects deleting an investor who has capital movement history', async () => {
    jest.mocked(prisma.investorInvestmentMovement.count).mockResolvedValue(1);
    await expect(service.remove('investor-6', 'admin-1')).rejects.toThrow(/movimientos de capital/);
    expect(prisma.investorInvestment.deleteMany).not.toHaveBeenCalled();
    expect(prisma.investor.delete).not.toHaveBeenCalled();
  });

  it('records an audit entry when deleting an investor without financial history', async () => {
    jest.mocked(prisma.investor.findUnique).mockResolvedValue({
      id: 'investor-6',
      code: 'INV-0006',
    } as never);
    jest.mocked(prisma.investor.delete).mockResolvedValue({
      id: 'investor-6',
      code: 'INV-0006',
    } as never);

    await expect(service.remove('investor-6', 'admin-1')).resolves.toMatchObject({
      id: 'investor-6',
    });
    expect(prisma.investorInvestment.deleteMany).not.toHaveBeenCalled();
    expect(prisma.investorInvestment.count).toHaveBeenCalledWith({
      where: { investorId: 'investor-6' },
    });
    expect(prisma.investorPayment.count).toHaveBeenCalledWith({
      where: { investorId: 'investor-6' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'admin-1',
        action: 'INVESTOR_DELETED',
        entityType: 'Investor',
        entityId: 'investor-6',
        oldValues: { code: 'INV-0006' },
      },
    });
  });

  it('does not delete an investor who does not exist', async () => {
    jest.mocked(prisma.investor.findUnique).mockResolvedValue(null);
    await expect(service.remove('missing', 'admin-1')).rejects.toThrow('Investor not found');
    expect(prisma.investor.delete).not.toHaveBeenCalled();
  });
});
