import { BadRequestException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CollectionInteractionsService } from './collection-interactions.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loan: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
    paymentPromise: { updateMany: jest.fn() },
    collectionInteraction: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe('CollectionInteractionsService', () => {
  let service: CollectionInteractionsService;

  beforeEach(() => {
    service = new CollectionInteractionsService();
    jest.mocked(prisma.loan.findUnique).mockResolvedValue({
      id: 'loan-1',
      clientId: 12,
      client: { id: 12, firstName: 'Ana', lastName: 'Pérez' },
    } as never);
  });

  afterEach(() => jest.clearAllMocks());

  it('records a payment promise and creates its follow-up task atomically', async () => {
    const tx = {
      collectionInteraction: {
        create: jest.fn().mockResolvedValue({ id: 'interaction-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'interaction-1' }),
      },
      paymentPromise: { create: jest.fn() },
      task: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as never));

    await service.create(
      {
        loanId: 'loan-1',
        channel: 'CALL',
        result: 'PAYMENT_PROMISE',
        notes: 'Pagará el viernes',
        promiseAmount: 5000,
        promiseDate: '2026-07-17',
      },
      'collector-1',
    );

    expect(tx.paymentPromise.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        interactionId: 'interaction-1',
        loanId: 'loan-1',
        clientId: 12,
        amount: 5000,
        createdById: 'collector-1',
      }),
    });
    expect(tx.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Seguimiento de cobro: Ana Pérez',
        dueDate: new Date('2026-07-17T12:00:00.000Z'),
        category: 'cobro',
        priority: 'HIGH',
        collectionInteractionId: 'interaction-1',
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'COLLECTION_INTERACTION_CREATED' }),
    });
  });

  it('rejects incomplete promise details', async () => {
    await expect(
      service.create(
        {
          loanId: 'loan-1',
          channel: 'CALL',
          result: 'PAYMENT_PROMISE',
          notes: 'Prometió pagar',
        },
        'collector-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a client contact without selecting a loan and schedules it in Agenda', async () => {
    jest.mocked(prisma.client.findUnique).mockResolvedValue({
      id: 12,
      firstName: 'Ana',
      lastName: 'Pérez',
    } as never);
    const tx = {
      collectionInteraction: {
        create: jest.fn().mockResolvedValue({ id: 'interaction-2' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'interaction-2' }),
      },
      paymentPromise: { create: jest.fn() },
      task: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as never));

    await service.create(
      {
        clientId: 12,
        channel: 'CALL',
        result: 'CONTACTED',
        notes: 'Pasará el lunes',
        nextFollowUpDate: '2026-07-20',
        nextFollowUpTime: '10:30',
      },
      'collector-1',
    );

    expect(tx.collectionInteraction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ clientId: 12, loanId: null }),
    });
    expect(tx.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Contactar cliente: Ana Pérez',
        category: 'cliente',
        clientId: 12,
        loanId: null,
        dueDate: new Date('2026-07-20T12:00:00.000Z'),
        time: '10:30',
      }),
    });
    expect(tx.paymentPromise.create).not.toHaveBeenCalled();
  });

  it('marks expired promises broken before returning the history', async () => {
    jest.mocked(prisma.loan.findUnique).mockResolvedValue({ id: 'loan-1' } as never);
    jest.mocked(prisma.collectionInteraction.findMany).mockResolvedValue([]);

    await service.findByLoan('loan-1');

    expect(prisma.paymentPromise.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        loanId: 'loan-1',
        status: { in: ['PENDING', 'PARTIAL'] },
      }),
      data: { status: 'BROKEN' },
    });
  });
});
