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

  it('deletes only an existing manual movement and records the audit entry', async () => {
    const movement = {
      id: 'movement-1',
      type: 'OUT',
      person: 'Compra de agua',
      amount: 250,
      movementDate: new Date('2026-07-14T16:00:00.000Z'),
      category: 'Salida manual',
      affectsBalance: true,
    };
    const tx = {
      cashMovement: {
        findUnique: jest.fn().mockResolvedValue(movement),
        delete: jest.fn().mockResolvedValue(movement),
      },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await expect(service.deleteMovement('movement-1', 'MANUAL', 'user-1')).resolves.toEqual({
      id: 'movement-1',
      sourceType: 'MANUAL',
    });
    expect(tx.cashMovement.delete).toHaveBeenCalledWith({ where: { id: 'movement-1' } });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CASH_MOVEMENT_DELETED',
        entityId: 'movement-1',
        userId: 'user-1',
      }),
    });
  });

  it('does not create an audit entry when the manual movement does not exist', async () => {
    const tx = {
      cashMovement: { findUnique: jest.fn().mockResolvedValue(null), delete: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await expect(service.deleteMovement('missing', 'MANUAL', 'user-1')).rejects.toThrow(
      'Movimiento de caja no encontrado',
    );
    expect(tx.cashMovement.delete).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('excludes generated movements without deleting their source record', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'payment-1' }]),
      cashLedgerExclusion: { upsert: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await expect(service.deleteMovement('payment-1', 'PAYMENT', 'user-1')).resolves.toEqual({
      id: 'payment-1',
      sourceType: 'PAYMENT',
    });
    expect(tx.cashLedgerExclusion.upsert).toHaveBeenCalledWith({
      where: { sourceType_sourceId: { sourceType: 'PAYMENT', sourceId: 'payment-1' } },
      update: { createdById: 'user-1' },
      create: { sourceType: 'PAYMENT', sourceId: 'payment-1', createdById: 'user-1' },
    });
  });
});
