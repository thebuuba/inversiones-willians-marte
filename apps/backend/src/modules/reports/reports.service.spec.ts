import { ReportsService } from './reports.service';
import { prisma } from '@inversiones/database';
import type { PortfolioScope } from '../../common/portfolio-scope';

const adminScope: PortfolioScope = { userId: 'admin', isAdmin: true, portfolioIds: [] };

jest.mock('@inversiones/database', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    client: { count: jest.fn() },
    loan: { aggregate: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    payment: { aggregate: jest.fn(), groupBy: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn() },
  },
  Prisma: {
    empty: '',
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    join: (values: unknown[]) => values.join(', '),
  },
}));

describe('ReportsService', () => {
  const service = new ReportsService();

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('starts every overview section concurrently', async () => {
    const methods = [
      'dashboard',
      'portfolioByStatus',
      'monthlyCollections',
      'dailyIncome',
      'weeklyMovement',
      'upcomingPayments',
      'collectionPriorities',
    ] as const;
    const resolvers = new Map<string, (value: never) => void>();

    for (const method of methods) {
      jest
        .spyOn(service, method)
        .mockImplementation(
          () => new Promise((resolve) => resolvers.set(method, resolve)) as never,
        );
    }

    const result = service.overview(adminScope);
    await Promise.resolve();

    for (const method of methods) {
      expect(service[method]).toHaveBeenCalledTimes(1);
      resolvers.get(method)?.([] as never);
    }

    await expect(result).resolves.toEqual({
      dashboard: [],
      portfolio: [],
      monthlyCollections: [],
      dailyIncome: [],
      weeklyMovement: [],
      upcomingPayments: [],
      collectionPriorities: [],
    });
  });

  it('ranks overdue loans by explainable collection priority', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    jest.mocked(prisma.loan.findMany).mockResolvedValue([
      {
        id: 'loan-1',
        loanNumber: 101,
        balance: 5000,
        client: {
          id: 1,
          firstName: 'Ana',
          lastName: 'Pérez',
          phone: '8095550101',
          collectionInteractions: [{ createdAt: new Date('2026-06-03T00:00:00.000Z') }],
        },
        schedule: [
          { dueDate: new Date('2026-05-14T00:00:00.000Z'), amount: 1000, paidAmount: 250 },
          { dueDate: new Date('2026-06-01T00:00:00.000Z'), amount: 1000, paidAmount: null },
        ],
        paymentPromises: [{ id: 'promise-1' }],
      },
    ] as never);

    await expect(service.collectionPriorities(adminScope)).resolves.toEqual([
      expect.objectContaining({
        loanId: 'loan-1',
        loanNumber: 101,
        clientName: 'Ana Pérez',
        overdueAmount: 1750,
        daysOverdue: 35,
        score: 80,
        level: 'URGENT',
        suggestedAction: 'Contactar por promesa incumplida',
      }),
    ]);
  });

  it('binds the six-month cutoff in the monthly collections query', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await service.monthlyCollections(adminScope);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(jest.mocked(prisma.$queryRaw).mock.calls[0]).toHaveLength(3);
    expect(jest.mocked(prisma.$queryRaw).mock.calls[0][1]).toBeInstanceOf(Date);
  });

  it('groups portfolio by calculated collection status', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([
      { status: 'CURRENT', count: 5, balance: 5000, principal: 6000 },
      { status: 'LATE', count: 3, balance: 3000, principal: 4000 },
    ]);

    await expect(service.portfolioByStatus(adminScope)).resolves.toEqual([
      { status: 'CURRENT', count: 5, balance: 5000, principal: 6000 },
      { status: 'LATE', count: 3, balance: 3000, principal: 4000 },
    ]);

    const queryParts = jest.mocked(prisma.$queryRaw).mock.calls[0][0] as TemplateStringsArray;
    const queryText = Array.from(queryParts).join(' ');
    expect(queryText).toContain('oldest_unpaid');
    expect(queryText).toContain("ELSE 'LATE'");
    expect(queryText).toContain('grace_days');
  });

  it('maps daily income allocations into chart values', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        date: new Date('2026-06-18T00:00:00.000Z'),
        capital: '1200.50',
        interest: '300.25',
        lateFee: '75',
      },
    ]);

    await expect(service.dailyIncome(adminScope)).resolves.toEqual([
      {
        date: '2026-06-18',
        label: '18/06',
        capital: 1200.5,
        interest: 300.25,
        lateFee: 75,
      },
    ]);
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

    const result = service.dashboard(adminScope);
    await Promise.resolve();

    expect(prisma.loan.count).toHaveBeenCalledTimes(2);

    resolveActiveLoans(4);
    await expect(result).resolves.toEqual(
      expect.objectContaining({ activeLoans: 4, overdueLoans: 2 }),
    );
  });

  it('uses a UTC calendar-day window for today payments', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-18T12:34:56.789Z'));
    jest.mocked(prisma.loan.count).mockResolvedValue(0);
    jest.mocked(prisma.client.count).mockResolvedValue(0);
    jest.mocked(prisma.payment.aggregate).mockResolvedValue({ _sum: { amount: 0 } } as never);
    jest
      .mocked(prisma.loan.aggregate)
      .mockResolvedValue({ _sum: { balance: 0, principal: 0 }, _count: 0 } as never);

    await service.dashboard(adminScope);

    expect(prisma.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          paymentDate: {
            gte: new Date('2026-06-18T00:00:00.000Z'),
            lt: new Date('2026-06-19T00:00:00.000Z'),
          },
        },
      }),
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

    await expect(service.collectorPerformance(adminScope)).resolves.toEqual([
      { id: 'collector-1', name: 'Ana', paymentsCount: 3, totalCollected: 1500 },
      { id: 'collector-2', name: 'Luis', paymentsCount: 1, totalCollected: 400 },
    ]);

    expect(prisma.payment.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.payment.aggregate).not.toHaveBeenCalled();
  });

  it('skips payment aggregation when there are no active collectors', async () => {
    jest.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    await expect(service.collectorPerformance(adminScope)).resolves.toEqual([]);

    expect(prisma.payment.groupBy).not.toHaveBeenCalled();
  });

  it('aggregates weekly movement without per-day lateral scans', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await service.weeklyMovement(adminScope);

    const queryParts = jest.mocked(prisma.$queryRaw).mock.calls[0][0] as TemplateStringsArray;
    const queryText = Array.from(queryParts).join(' ');
    expect(queryText).toContain('EXTRACT(ISODOW FROM start_date)');
    expect(queryText).toContain('EXTRACT(ISODOW FROM end_date)');
    expect(queryText).not.toContain('LATERAL');
    expect(queryText).not.toContain('TO_CHAR');
  });
});
