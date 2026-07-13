import { prisma } from '@inversiones/database';
import { HealthController } from './health.controller';

jest.mock('@inversiones/database', () => ({
  prisma: { $queryRaw: jest.fn() },
}));

describe('HealthController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checks the database before reporting the backend as healthy', async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    await expect(new HealthController().getHealth()).resolves.toEqual({
      status: 'ok',
      service: 'backend',
      database: 'ok',
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('does not report success when the database is unavailable', async () => {
    jest.mocked(prisma.$queryRaw).mockRejectedValue(new Error('database unavailable'));

    await expect(new HealthController().getHealth()).rejects.toThrow('database unavailable');
  });
});
