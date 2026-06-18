import { prisma } from '@inversiones/database';
import { PortfoliosService } from './portfolios.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    portfolio: {
      findUnique: jest.fn(),
      delete: jest.fn(),
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
});
