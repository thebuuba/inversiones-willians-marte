import { RequestsService } from './requests.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
  prisma: {
    loanRequest: {
      count: jest.fn(),
      create: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe('RequestsService', () => {
  const service = new RequestsService();

  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma));
  });

  it('formats request names before creating a request', async () => {
    jest.mocked(prisma.loanRequest.count).mockResolvedValue(0);
    jest.mocked(prisma.loanRequest.create).mockResolvedValue({ id: 'request-1' } as never);

    await service.create({ firstName: 'roberto', lastName: 'lopez', amount: 1000 }, 'user-1');

    expect(prisma.loanRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'Roberto',
          lastName: 'Lopez',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'LOAN_REQUEST_CREATED',
        entityId: 'request-1',
        userId: 'user-1',
      }),
    });
  });
});
