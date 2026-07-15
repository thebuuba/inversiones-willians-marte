import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loan: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  const paymentDate = '2026-06-10';
  const schedule = {
    id: 'schedule-1',
    amount: 100,
    paidAmount: 0,
    interestPart: 20,
    status: 'PENDING',
    dueDate: new Date('2026-06-15'),
    paymentAllocs: [],
  };
  const loan = {
    id: 'loan-1',
    clientId: 1,
    status: 'ACTIVE',
    totalAmount: 100,
    schedule: [schedule],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks a fully paid schedule as paid when one payment allocates interest and principal', async () => {
    const paymentScheduleUpdate = jest.fn();
    const loanUpdate = jest.fn();
    const tx = {
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'payment-1', allocations: [] }),
      },
      paymentSchedule: {
        update: paymentScheduleUpdate,
      },
      paymentPromise: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      loan: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(loan)
          .mockResolvedValueOnce({
            ...loan,
            schedule: [{ ...schedule, paidAmount: 100, status: 'PAID' }],
          }),
        update: loanUpdate,
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.create(
      {
        loanId: 'loan-1',
        clientId: 1,
        amount: 100,
        paymentDate,
      },
      'user-1',
    );

    expect(paymentScheduleUpdate).toHaveBeenCalledWith({
      where: { id: 'schedule-1' },
      data: {
        status: 'PAID',
        paidDate: new Date(paymentDate),
        paidAmount: 100,
      },
    });
    expect(loanUpdate).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      data: {
        balance: 0,
        status: 'PAID',
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'LOAN_STATUS_CHANGED',
        entityType: 'Loan',
        entityId: 'loan-1',
        clientId: 1,
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'PAID', balance: 0 },
      }),
    });
  });

  it('writes an audit event when a payment is created', async () => {
    const auditCreate = jest.fn();
    const tx = {
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'payment-1', amount: 100, allocations: [] }),
      },
      paymentSchedule: {
        update: jest.fn(),
      },
      paymentPromise: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      loan: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(loan)
          .mockResolvedValueOnce({
            ...loan,
            schedule: [{ ...schedule, paidAmount: 100, status: 'PAID' }],
          }),
        update: jest.fn(),
      },
      auditLog: {
        create: auditCreate,
      },
    };

    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.create(
      {
        loanId: 'loan-1',
        clientId: 1,
        amount: 100,
        paymentDate,
      },
      'user-1',
    );

    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: 'payment-1',
        clientId: 1,
        newValues: expect.objectContaining({ loanId: 'loan-1', amount: 100 }),
      }),
    });
  });

  it('keeps indefinite loans active with principal balance after interest payment', async () => {
    const loanUpdate = jest.fn();
    const paymentScheduleUpsert = jest.fn().mockResolvedValue({
      id: 'schedule-2',
      dueDate: new Date('2026-07-15'),
      amount: 600,
      paidAmount: null,
      status: 'PENDING',
    });
    const tx = {
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'payment-1', amount: 591.06, allocations: [] }),
      },
      paymentSchedule: {
        update: jest.fn(),
        upsert: paymentScheduleUpsert,
      },
      paymentPromise: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      loan: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            ...loan,
            principal: 39404,
            interestRate: 18,
            interestType: 'INDEFINITE',
            paymentFreq: 'MONTHLY',
            startDate: new Date('2026-05-15'),
            totalAmount: 591.06,
            schedule: [{ ...schedule, amount: 591.06, interestPart: 591.06 }],
          })
          .mockResolvedValueOnce({
            ...loan,
            principal: 39404,
            interestType: 'INDEFINITE',
            totalAmount: 591.06,
            schedule: [{ ...schedule, amount: 591.06, paidAmount: 591.06, status: 'PAID' }],
          }),
        update: loanUpdate,
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.create(
      {
        loanId: 'loan-1',
        clientId: 1,
        amount: 591.06,
        paymentDate,
      },
      'user-1',
    );

    expect(loanUpdate).toHaveBeenCalledWith({
      where: { id: 'loan-1' },
      data: {
        balance: 39404,
        status: 'ACTIVE',
      },
    });
    expect(paymentScheduleUpsert).toHaveBeenCalledWith({
      where: {
        loanId_dueDate: { loanId: 'loan-1', dueDate: new Date('2026-07-15') },
      },
      update: {},
      create: {
        loanId: 'loan-1',
        dueDate: new Date('2026-07-15'),
        amount: 600,
        principalPart: 0,
        interestPart: 600,
        balanceAfter: 39404,
      },
    });
  });

  it('repairs an active indefinite loan that has no pending schedule before collecting', async () => {
    const paidSchedule = {
      ...schedule,
      dueDate: new Date('2026-06-15'),
      amount: 600,
      interestPart: 600,
      paidAmount: 600,
      status: 'PAID',
    };
    const createdSchedules: any[] = [];
    const tx = {
      payment: { create: jest.fn().mockResolvedValue({ id: 'payment-2', allocations: [] }) },
      paymentSchedule: {
        update: jest.fn(),
        upsert: jest.fn().mockImplementation(({ create }) => {
          const created = {
            ...create,
            id: `schedule-${createdSchedules.length + 2}`,
            paidAmount: null,
            status: 'PENDING',
          };
          createdSchedules.push(created);
          return created;
        }),
      },
      paymentPromise: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
      loan: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            ...loan,
            principal: 40000,
            interestRate: 18,
            interestType: 'INDEFINITE',
            paymentFreq: 'MONTHLY',
            startDate: new Date('2026-05-15'),
            schedule: [paidSchedule],
          })
          .mockResolvedValueOnce({
            ...loan,
            principal: 40000,
            interestType: 'INDEFINITE',
            schedule: [paidSchedule, ...createdSchedules],
          }),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.create({ loanId: 'loan-1', clientId: 1, amount: 600, paymentDate }, 'user-1');

    expect(tx.paymentSchedule.upsert).toHaveBeenCalledTimes(2);
    expect(createdSchedules.map((item) => item.dueDate)).toEqual([
      new Date('2026-07-15'),
      new Date('2026-08-15'),
    ]);
  });

  it('rejects a payment when the supplied client does not own the loan', async () => {
    const tx = { loan: { findUnique: jest.fn().mockResolvedValue(loan) } };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await expect(
      service.create({ loanId: 'loan-1', clientId: 999, amount: 100, paymentDate }, 'user-1'),
    ).rejects.toThrow('Payment client does not match the loan client');
  });

  it('fulfills the oldest open promise when its payment is registered', async () => {
    const promiseUpdate = jest.fn();
    const tx = {
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'payment-1', allocations: [] }),
      },
      paymentSchedule: { update: jest.fn() },
      paymentPromise: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'promise-1',
            interactionId: 'interaction-1',
            amount: 100,
            fulfilledAmount: 0,
            status: 'PENDING',
          },
        ]),
        update: promiseUpdate,
      },
      task: { updateMany: jest.fn() },
      loan: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(loan)
          .mockResolvedValueOnce({
            ...loan,
            schedule: [{ ...schedule, paidAmount: 100, status: 'PAID' }],
          }),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.create({ loanId: 'loan-1', clientId: 1, amount: 100, paymentDate }, 'user-1');

    expect(promiseUpdate).toHaveBeenCalledWith({
      where: { id: 'promise-1' },
      data: { fulfilledAmount: 100, status: 'FULFILLED' },
    });
    expect(tx.task.updateMany).toHaveBeenCalledWith({
      where: { collectionInteractionId: 'interaction-1', status: { not: 'COMPLETED' } },
      data: { status: 'COMPLETED' },
    });
  });

  it('rejects an amount greater than the outstanding scheduled balance', async () => {
    const tx = { loan: { findUnique: jest.fn().mockResolvedValue(loan) } };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await expect(
      service.create({ loanId: 'loan-1', clientId: 1, amount: 101, paymentDate }, 'user-1'),
    ).rejects.toThrow('Payment exceeds the outstanding scheduled balance');
  });

  it('allocates only the remaining interest on a partially paid schedule', async () => {
    const paymentCreate = jest.fn().mockResolvedValue({ id: 'payment-2', allocations: [] });
    const partiallyPaidSchedule = {
      ...schedule,
      paidAmount: 10,
      status: 'PARTIAL',
      paymentAllocs: [{ amount: 10, type: 'INTEREST' }],
    };
    const tx = {
      payment: { create: paymentCreate },
      paymentSchedule: { update: jest.fn() },
      paymentPromise: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      loan: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ ...loan, schedule: [partiallyPaidSchedule] })
          .mockResolvedValueOnce({
            ...loan,
            schedule: [{ ...partiallyPaidSchedule, paidAmount: 100, status: 'PAID' }],
          }),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as any));

    await service.create({ loanId: 'loan-1', clientId: 1, amount: 90, paymentDate }, 'user-1');

    expect(paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          allocations: {
            create: [
              { scheduleId: 'schedule-1', amount: 10, type: 'INTEREST' },
              { scheduleId: 'schedule-1', amount: 80, type: 'PRINCIPAL' },
            ],
          },
        }),
      }),
    );
  });
});
