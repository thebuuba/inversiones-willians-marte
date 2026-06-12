import { InvestorsService } from './investors.service';
import { prisma, Prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    investor: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates the next investor code from the highest existing code instead of row count', async () => {
    jest.mocked(prisma.investor.count).mockResolvedValue(2);
    jest.mocked(prisma.investor.findFirst).mockResolvedValue({ code: 'INV-0005' } as never);
    jest.mocked(prisma.investor.create).mockResolvedValue({ id: 'investor-6' } as never);

    await service.create(dto, 'user-1');

    expect(prisma.investor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'INV-0006' }),
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
      .mockResolvedValueOnce({ id: 'investor-7' } as never);

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
