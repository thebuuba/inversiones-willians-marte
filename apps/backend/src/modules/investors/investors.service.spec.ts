import { InvestorsService } from './investors.service';
import { prisma, Prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    investor: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    investorInvestment: {
      create: jest.fn(),
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
    name: 'Inversionista Nuevo',
    capital: 10000,
    monthlyPayment: 100,
    rate: 3,
    startDate: '2026-07-10',
  };

  beforeEach(() => {
    service = new InvestorsService();
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        investor: prisma.investor,
        investorInvestment: prisma.investorInvestment,
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
    jest.clearAllMocks();
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
        data: expect.objectContaining({ code: 'INV-0006' }),
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
});
