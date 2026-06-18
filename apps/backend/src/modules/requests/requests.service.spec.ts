import { RequestsService } from './requests.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loanRequest: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('RequestsService', () => {
  const service = new RequestsService();

  afterEach(() => jest.clearAllMocks());

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
  });
});
