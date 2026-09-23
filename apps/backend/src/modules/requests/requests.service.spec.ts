import { RequestsService } from './requests.service';
import { prisma } from '@inversiones/database';
import type { PortfolioScope } from '../../common/portfolio-scope';
import { FileStorageService } from '../../common/storage/file-storage.service';

const adminScope: PortfolioScope = { userId: 'admin', isAdmin: true, portfolioIds: [] };

jest.mock('@inversiones/database', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
  prisma: {
    loanRequest: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    loanRequestPhoto: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe('RequestsService', () => {
  const storage = {
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };
  const service = new RequestsService(storage as unknown as FileStorageService);

  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma));
  });

  it('formats request names before creating a request', async () => {
    jest.mocked(prisma.loanRequest.count).mockResolvedValue(0);
    jest.mocked(prisma.loanRequest.create).mockResolvedValue({ id: 'request-1' } as never);

    await service.create(
      adminScope,
      { firstName: 'roberto', lastName: 'lopez', amount: 1000 },
      'user-1',
    );

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

  it('creates a request when every applicant field is omitted', async () => {
    jest.mocked(prisma.loanRequest.count).mockResolvedValue(0);
    jest.mocked(prisma.loanRequest.create).mockResolvedValue({ id: 'request-2' } as never);

    await service.create(adminScope, {}, 'user-1');

    expect(prisma.loanRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstName: null, lastName: null, amount: null }),
      }),
    );
  });

  it('removes an uploaded photo when its database record fails', async () => {
    jest.mocked(prisma.loanRequest.findUnique).mockResolvedValue({ id: 'request-1' } as never);
    jest.mocked(prisma.loanRequestPhoto.create).mockRejectedValue(new Error('database failed'));
    const file = { buffer: Buffer.from('image'), mimetype: 'image/png' };

    await expect(service.addPhoto(adminScope, 'request-1', file)).rejects.toThrow(
      'database failed',
    );
    expect(storage.put).toHaveBeenCalledWith(
      expect.stringMatching(/^requests\/photos\/.+\.png$/),
      file.buffer,
      'image/png',
    );
    expect(storage.delete).toHaveBeenCalledWith(
      expect.stringMatching(/^requests\/photos\/.+\.png$/),
    );
  });

  it('updates and clears optional fields without changing the request status', async () => {
    jest.mocked(prisma.loanRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      firstName: 'Ana',
      lastName: 'Perez',
      identification: null,
      phone: null,
      amount: null,
      description: null,
      reference: null,
      status: 'PENDING',
    } as never);
    jest.mocked(prisma.loanRequest.update).mockResolvedValue({
      id: 'request-1',
      firstName: 'Maria',
      lastName: null,
      status: 'PENDING',
      clientId: null,
    } as never);

    await service.update(adminScope, 'request-1', { firstName: 'maria', lastName: null }, 'admin');

    expect(prisma.loanRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1' },
        data: { firstName: 'Maria', lastName: null },
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'LOAN_REQUEST_UPDATED',
        entityId: 'request-1',
        userId: 'admin',
      }),
    });
  });

  it('rejects edits to a request outside the user scope', async () => {
    jest.mocked(prisma.loanRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      createdById: 'another-user',
      clientId: null,
    } as never);
    await expect(
      service.update(
        { userId: 'collector', isAdmin: false, portfolioIds: [] },
        'request-1',
        { firstName: 'Maria' },
        'collector',
      ),
    ).rejects.toThrow('You cannot access this request');
    expect(prisma.loanRequest.update).not.toHaveBeenCalled();
  });

  it('does not write an audit entry when no data changes', async () => {
    jest.mocked(prisma.loanRequest.findUnique).mockResolvedValue({ firstName: 'Ana' } as never);
    jest
      .mocked(prisma.loanRequest.findUniqueOrThrow)
      .mockResolvedValue({ firstName: 'Ana' } as never);

    await service.update(adminScope, 'request-1', { firstName: 'ana' }, 'admin');

    expect(prisma.loanRequest.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
