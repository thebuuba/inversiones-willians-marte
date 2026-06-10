import { ReportsService } from './reports.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    client: { count: jest.fn() },
    loan: { aggregate: jest.fn(), count: jest.fn() },
    payment: { aggregate: jest.fn(), groupBy: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn() },
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

  it('aggregates collector totals in one grouped payment query', async () => {
    jest.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'collector-1', name: 'Ana', _count: { receivedPayments: 3 } },
      { id: 'collector-2', name: 'Luis', _count: { receivedPayments: 1 } },
    ] as never);
    jest.mocked(prisma.payment.groupBy).mockResolvedValue([
      { receivedById: 'collector-1', _sum: { amount: 1500 } },
      { receivedById: 'collector-2', _sum: { amount: 400 } },
    ] as never);

    await expect(service.collectorPerformance()).resolves.toEqual([
      { id: 'collector-1', name: 'Ana', paymentsCount: 3, totalCollected: 1500 },
      { id: 'collector-2', name: 'Luis', paymentsCount: 1, totalCollected: 400 },
    ]);

    expect(prisma.payment.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.payment.aggregate).not.toHaveBeenCalled();
  });

  it('skips payment aggregation when there are no active collectors', async () => {
    jest.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    await expect(service.collectorPerformance()).resolves.toEqual([]);

    expect(prisma.payment.groupBy).not.toHaveBeenCalled();
  });

  it('aggregates weekly movement without per-day lateral scans', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await service.weeklyMovement();

    const queryParts = jest.mocked(prisma.$queryRaw).mock.calls[0][0] as TemplateStringsArray;
    const queryText = Array.from(queryParts).join(' ');
    expect(queryText).toContain('EXTRACT(ISODOW FROM start_date)');
    expect(queryText).toContain('EXTRACT(ISODOW FROM end_date)');
    expect(queryText).not.toContain('LATERAL');
    expect(queryText).not.toContain('TO_CHAR');
  });
});
