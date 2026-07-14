import { prisma } from '@inversiones/database';
import { CashService } from './cash.service';

jest.mock('@inversiones/database', () => ({
  Prisma: { sql: jest.fn() },
  prisma: { $transaction: jest.fn() },
}));

describe('CashService', () => {
  const service = new CashService();

  afterEach(() => jest.clearAllMocks());

  it('creates the movement and audit record atomically', async () => {
    const tx = {
      cashMovement: {
        create: jest.fn().mockResolvedValue({ id: 'movement-1' }),
      },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.createManual(
      {
        type: 'IN',
        person: ' Capital inicial ',
        amount: 5000,
        movementDate: '2026-07-14',
      },
      'user-1',
    );

    expect(tx.cashMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ person: 'Capital inicial', amount: 5000 }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'CASH_MOVEMENT_CREATED',
        entityId: 'movement-1',
      }),
    });
  });
});
