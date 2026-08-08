import * as bcrypt from 'bcryptjs';
import { prisma } from '@inversiones/database';
import { UsersService } from './users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('@inversiones/database', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    portfolio: {
      findMany: jest.fn(),
    },
    userPortfolio: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    authSession: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes an audit event when an admin creates a user', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
    jest.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-2',
      name: 'Collector',
      username: 'collector',
      email: 'collector@usuarios.local',
      role: 'COLLECTOR',
      active: true,
    } as any);

    await service.create(
      {
        name: 'Collector',
        username: 'collector',
        password: 'Secret123',
        role: 'COLLECTOR',
      },
      'admin-1',
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('Secret123', 10);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: 'user-2',
        newValues: expect.objectContaining({ role: 'COLLECTOR', active: true }),
      }),
    });
  });

  it('normalizes the username and creates its internal email', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
    jest.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-2',
      name: 'Collector',
      username: 'collector.one',
      email: 'collector.one@usuarios.local',
      role: 'COLLECTOR',
      active: true,
    } as any);

    await service.create({
      name: 'Collector',
      username: ' Collector.One ',
      password: 'Secret123',
      role: 'COLLECTOR',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'collector.one' },
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: 'collector.one',
          email: 'collector.one@usuarios.local',
        }),
      }),
    );
  });

  it('writes an audit event when an admin toggles user active state', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-2', active: true } as any);
    jest.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-2',
      active: false,
      role: 'COLLECTOR',
    } as any);

    await service.toggleActive('user-2', 'admin-1');

    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-2', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'USER_ACTIVE_TOGGLED',
        entityType: 'User',
        entityId: 'user-2',
        oldValues: { active: true },
        newValues: { active: false },
      }),
    });
  });

  it('replaces a collector portfolio assignments inside a transaction', async () => {
    jest
      .mocked(prisma.user.findUnique)
      .mockResolvedValue({ id: 'user-2', role: 'COLLECTOR' } as any);
    jest.mocked(prisma.userPortfolio.findMany).mockResolvedValue([
      { userId: 'user-2', portfolioId: 'portfolio-1' },
      { userId: 'user-2', portfolioId: 'portfolio-2' },
    ] as any);
    jest
      .mocked(prisma.portfolio.findMany)
      .mockResolvedValue([{ id: 'portfolio-2' }, { id: 'portfolio-3' }] as any);
    jest.mocked(prisma.$transaction).mockResolvedValue(undefined);

    const result = await service.updatePortfolioAssignments(
      'user-2',
      ['portfolio-2', 'portfolio-2', 'portfolio-3'],
      'admin-1',
    );

    expect(prisma.userPortfolio.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-2' } });
    expect(prisma.userPortfolio.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-2', portfolioId: 'portfolio-2' },
        { userId: 'user-2', portfolioId: 'portfolio-3' },
      ],
    });
    expect(result).toEqual({ portfolioIds: ['portfolio-2', 'portfolio-3'] });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'PORTFOLIO_ASSIGNMENTS_UPDATED',
        entityType: 'User',
        entityId: 'user-2',
        oldValues: { portfolioIds: ['portfolio-1', 'portfolio-2'] },
        newValues: { portfolioIds: ['portfolio-2', 'portfolio-3'] },
      }),
    });
  });

  it('rejects assignments for admin users', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as any);

    await expect(
      service.updatePortfolioAssignments('admin-1', ['portfolio-1'], 'admin-1'),
    ).rejects.toThrow('Los administradores no necesitan carteras asignadas');
    expect(prisma.userPortfolio.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects assignments that reference non-existent portfolios', async () => {
    jest
      .mocked(prisma.user.findUnique)
      .mockResolvedValue({ id: 'user-2', role: 'COLLECTOR' } as any);
    jest.mocked(prisma.userPortfolio.findMany).mockResolvedValue([]);
    jest.mocked(prisma.portfolio.findMany).mockResolvedValue([{ id: 'portfolio-2' }] as any);

    await expect(
      service.updatePortfolioAssignments('user-2', ['portfolio-2', 'missing-1'], 'admin-1'),
    ).rejects.toThrow('Alguna cartera no existe');
    expect(prisma.userPortfolio.deleteMany).not.toHaveBeenCalled();
  });
});
