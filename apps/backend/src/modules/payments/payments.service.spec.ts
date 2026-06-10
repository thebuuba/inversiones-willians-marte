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
  };
  const loan = {
    id: 'loan-1',
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
      loan: {
        findUnique: jest.fn().mockResolvedValue({
          ...loan,
          schedule: [{ ...schedule, paidAmount: 100, status: 'PAID' }],
        }),
        update: loanUpdate,
      },
    };

    jest.mocked(prisma.loan.findUnique).mockResolvedValue(loan as any);
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
  });
});
