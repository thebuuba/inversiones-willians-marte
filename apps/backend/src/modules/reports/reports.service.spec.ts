import { ReportsService } from './reports.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    client: { count: jest.fn() },
    loan: { aggregate: jest.fn(), count: jest.fn() },
    payment: { aggregate: jest.fn() },
    user: { count: jest.fn() },
  },
}));

describe('ReportsService', () => {
  const service = new ReportsService();

  afterEach(() => jest.clearAllMocks());

  it('binds the six-month cutoff in the monthly collections query', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await service.monthlyCollections();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(jest.mocked(prisma.$queryRaw).mock.calls[0]).toHaveLength(2);
    expect(jest.mocked(prisma.$queryRaw).mock.calls[0][1]).toBeInstanceOf(Date);
  });

  it('starts all dashboard queries before waiting for remote results', async () => {
    let resolveActiveLoans: (value: number) => void = () => undefined;
    const activeLoans = new Promise<number>((resolve) => {
      resolveActiveLoans = resolve;
    });
    jest
      .mocked(prisma.loan.count)
      .mockReturnValueOnce(activeLoans as never)
      .mockResolvedValueOnce(2);
    jest.mocked(prisma.client.count).mockResolvedValue(3);
    jest.mocked(prisma.user.count).mockResolvedValue(1);
    jest.mocked(prisma.payment.aggregate).mockResolvedValue({ _sum: { amount: 0 } } as never);
    jest
      .mocked(prisma.loan.aggregate)
      .mockResolvedValue({ _sum: { balance: 0, principal: 0 }, _count: 0 } as never);

    const result = service.dashboard();
    await Promise.resolve();

    expect(prisma.loan.count).toHaveBeenCalledTimes(2);

    resolveActiveLoans(4);
    await expect(result).resolves.toEqual(
      expect.objectContaining({ activeLoans: 4, overdueLoans: 2 }),
    );
  });
});
