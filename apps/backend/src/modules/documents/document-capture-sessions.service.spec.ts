import { GoneException, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { DocumentCaptureSessionsService } from './document-capture-sessions.service';
import { DocumentsService } from './documents.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    documentCaptureSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('DocumentCaptureSessionsService', () => {
  const documents = { create: jest.fn() } as unknown as jest.Mocked<DocumentsService>;
  let service: DocumentCaptureSessionsService;

  beforeEach(() => {
    service = new DocumentCaptureSessionsService(documents);
  });

  afterEach(() => jest.clearAllMocks());

  it('creates a temporary capture session for a client', async () => {
    jest.mocked(prisma.documentCaptureSession.create).mockResolvedValue({
      token: 'capture-token',
      clientId: 8,
      expiresAt: new Date('2026-06-11T14:40:00.000Z'),
      client: { firstName: 'Juan', lastName: 'Perez' },
    } as any);

    await expect(service.create(8, 'user-1')).resolves.toEqual({
      token: 'capture-token',
      clientId: 8,
      clientName: 'Juan Perez',
      expiresAt: '2026-06-11T14:40:00.000Z',
    });

    expect(prisma.documentCaptureSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: 8,
        createdById: 'user-1',
        token: expect.any(String),
        expiresAt: expect.any(Date),
      }),
      include: { client: { select: { firstName: true, lastName: true } } },
    });
  });

  it('returns session details for an active token', async () => {
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'active-token',
      clientId: 8,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);

    await expect(service.findActive('active-token')).resolves.toMatchObject({
      token: 'active-token',
      clientId: 8,
      clientName: 'Ana Diaz',
    });
  });

  it('throws NotFoundException when token does not exist', async () => {
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue(null);

    await expect(service.findActive('missing-token')).rejects.toThrow(NotFoundException);
  });

  it('throws GoneException when token is expired or already used', async () => {
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'expired-token',
      clientId: 8,
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);

    await expect(service.findActive('expired-token')).rejects.toThrow(GoneException);
  });
});
