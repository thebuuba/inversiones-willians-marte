import { prisma } from '@inversiones/database';
import { ClientPhotoCaptureSessionsService } from './client-photo-capture-sessions.service';
import type { PortfolioScope } from '../../common/portfolio-scope';

const adminScope: PortfolioScope = { userId: 'admin', isAdmin: true, portfolioIds: [] };

jest.mock('@inversiones/database', () => ({
  prisma: {
    client: { findUnique: jest.fn() },
    clientPhotoCaptureSession: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('ClientPhotoCaptureSessionsService', () => {
  const service = new ClientPhotoCaptureSessionsService();

  afterEach(() => jest.clearAllMocks());

  it('creates a capture session before a new client has an id', async () => {
    jest.mocked(prisma.clientPhotoCaptureSession.deleteMany).mockResolvedValue({ count: 0 });
    jest.mocked(prisma.clientPhotoCaptureSession.create).mockResolvedValue({
      token: 'photo-token',
      clientId: null,
      expiresAt: new Date('2026-07-13T20:10:00.000Z'),
      photoData: null,
      client: null,
    } as never);

    await expect(service.create(undefined, 'user-1', adminScope)).resolves.toMatchObject({
      token: 'photo-token',
      clientName: 'Nuevo cliente',
      photoReady: false,
    });
    expect(prisma.client.findUnique).not.toHaveBeenCalled();
  });

  it('stores the captured image as a data URL without a temporary file', async () => {
    jest.mocked(prisma.clientPhotoCaptureSession.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      service.upload('photo-token', { contents: Buffer.from('photo'), mimeType: 'image/png' }),
    ).resolves.toEqual({ uploaded: true });
    expect(prisma.clientPhotoCaptureSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ photoData: 'data:image/png;base64,cGhvdG8=' }),
      }),
    );
  });
});
