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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
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
      email: 'collector@example.com',
      role: 'COLLECTOR',
      active: true,
    } as any);

    await service.create(
      {
        name: 'Collector',
        email: 'collector@example.com',
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

  it('writes an audit event when an admin toggles user active state', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-2', active: true } as any);
    jest.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-2',
      active: false,
      role: 'COLLECTOR',
    } as any);

    await service.toggleActive('user-2', 'admin-1');

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
});
