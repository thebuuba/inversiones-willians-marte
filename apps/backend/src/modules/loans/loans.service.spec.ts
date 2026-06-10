import { LoansService } from './loans.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loan: {
      findUnique: jest.fn(),
    },
  },
}));

describe('LoansService', () => {
  let service: LoansService;

  beforeEach(() => {
    service = new LoansService({} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports remaining balance without subtracting payments twice', async () => {
    jest.mocked(prisma.loan.findUnique).mockResolvedValue({
      id: 'loan-1',
      totalAmount: 1000,
      balance: 700,
      schedule: [
        { status: 'PAID', dueDate: new Date('2026-05-10') },
        { status: 'PENDING', dueDate: new Date('2099-06-10') },
      ],
      payments: [{ amount: 300 }],
    } as any);

    await expect(service.getSummary('loan-1')).resolves.toMatchObject({
      totalPaid: 300,
      balance: 700,
      remaining: 700,
      progress: 30,
    });
  });
});
