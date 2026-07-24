import { prisma } from '@inversiones/database';
import { PortfoliosService } from './portfolios.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    portfolio: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    systemSettings: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('PortfoliosService', () => {
  let service: PortfoliosService;

  beforeEach(() => {
    service = new PortfoliosService();
    jest.mocked(prisma.systemSettings.findUnique).mockResolvedValue({ id: 1, graceDays: 5 } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes an audit event when a portfolio is deleted', async () => {
    jest.mocked(prisma.portfolio.findUnique).mockResolvedValue({
      id: 'portfolio-1',
      name: 'Principal',
      description: null,
      color: '#5FA37D',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { loans: 0 },
      loans: [],
    } as any);
    jest.mocked(prisma.portfolio.delete).mockResolvedValue({ id: 'portfolio-1' } as any);

    await service.remove('portfolio-1', 'admin-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'PORTFOLIO_DELETED',
        entityType: 'Portfolio',
        entityId: 'portfolio-1',
        oldValues: { name: 'Principal' },
      }),
    });
  });

  it('returns the next payment and the outstanding overdue amount', async () => {
    const dueDate = new Date('2026-07-30T12:00:00.000Z');
    jest.mocked(prisma.portfolio.findUnique).mockResolvedValue({
      id: 'portfolio-1',
      name: 'Principal',
      description: null,
      color: '#5FA37D',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { loans: 1 },
      loans: [
        {
          id: 'loan-1',
          loanNumber: 2,
          clientId: 1,
          principal: 70000,
          interestRate: 10,
          interestType: 'FIXED',
          totalAmount: 80000,
          balance: 66010,
          status: 'OVERDUE',
          createdAt: new Date(),
          schedule: [
            { dueDate, amount: 5000, paidAmount: 1000, status: 'PARTIAL' },
            { dueDate: new Date('2026-08-30'), amount: 5000, paidAmount: null, status: 'PENDING' },
          ],
          client: { id: 1, firstName: 'Ana', lastName: 'Pérez', identification: null, phone: null },
          product: { id: 'product-1', name: 'Préstamo Comercial' },
        },
      ],
    } as any);

    const portfolio = await service.findOne('portfolio-1');

    expect(portfolio.loans[0]).toEqual(
      expect.objectContaining({
        nextPaymentDate: dueDate,
        amountToCollect: 4000,
      }),
    );
  });
});
