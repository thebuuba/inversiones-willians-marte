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
      updateMany: jest.fn(),
      fields: {
        maxUploads: 'maxUploads',
      },
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
      closedAt: null,
      uploadCount: 0,
      maxUploads: 5,
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
      closedAt: null,
      uploadCount: 0,
      maxUploads: 5,
      expiresAt: new Date(Date.now() - 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);

    await expect(service.findActive('expired-token')).rejects.toThrow(GoneException);
  });

  it('throws GoneException when token is closed', async () => {
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'closed-token',
      clientId: 8,
      usedAt: null,
      closedAt: new Date(),
      uploadCount: 0,
      maxUploads: 5,
      expiresAt: new Date(Date.now() + 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);

    await expect(service.findActive('closed-token')).rejects.toThrow(GoneException);
  });

  it('throws GoneException when upload limit is reached', async () => {
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'full-token',
      clientId: 8,
      usedAt: null,
      closedAt: null,
      uploadCount: 5,
      maxUploads: 5,
      expiresAt: new Date(Date.now() + 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);

    await expect(service.findActive('full-token')).rejects.toThrow(GoneException);
  });

  it('reserves upload capacity before creating the document', async () => {
    jest.mocked(prisma.documentCaptureSession.updateMany).mockResolvedValue({ count: 1 } as any);
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'active-token',
      clientId: 8,
      createdById: 'user-1',
      usedAt: null,
      closedAt: null,
      uploadCount: 1,
      maxUploads: 5,
      expiresAt: new Date(Date.now() + 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);
    documents.create.mockResolvedValue({ id: 'doc-1' } as any);

    await service.upload('active-token', {
      name: 'cedula',
      fileUrl: 'cedula.webp',
      fileSize: 100,
      mimeType: 'image/webp',
      uploadedFile: {
        filename: 'cedula.webp',
        originalname: 'cedula.webp',
        mimetype: 'image/webp',
      },
    });

    expect(prisma.documentCaptureSession.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        token: 'active-token',
        closedAt: null,
        usedAt: null,
        uploadCount: { lt: expect.anything() },
      }),
      data: { uploadCount: { increment: 1 } },
    });
    expect(documents.create).toHaveBeenCalled();
    expect(prisma.documentCaptureSession.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: { uploadCount: { increment: 1 } },
      }),
    );
  });

  it('throws GoneException when upload capacity cannot be reserved for an existing token', async () => {
    jest.mocked(prisma.documentCaptureSession.updateMany).mockResolvedValue({ count: 0 } as any);
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'full-token',
      clientId: 8,
    } as any);

    await expect(service.upload('full-token', {
      name: 'cedula',
      fileUrl: 'cedula.webp',
      fileSize: 100,
      mimeType: 'image/webp',
      uploadedFile: {
        filename: 'cedula.webp',
        originalname: 'cedula.webp',
        mimetype: 'image/webp',
      },
    })).rejects.toThrow(GoneException);

    expect(documents.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when upload capacity cannot be reserved for a missing token', async () => {
    jest.mocked(prisma.documentCaptureSession.updateMany).mockResolvedValue({ count: 0 } as any);
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue(null);

    await expect(service.upload('missing-token', {
      name: 'cedula',
      fileUrl: 'cedula.webp',
      fileSize: 100,
      mimeType: 'image/webp',
      uploadedFile: {
        filename: 'cedula.webp',
        originalname: 'cedula.webp',
        mimetype: 'image/webp',
      },
    })).rejects.toThrow(NotFoundException);

    expect(documents.create).not.toHaveBeenCalled();
  });

  it('rolls back the reserved upload count when document creation fails', async () => {
    jest.mocked(prisma.documentCaptureSession.updateMany).mockResolvedValue({ count: 1 } as any);
    jest.mocked(prisma.documentCaptureSession.update).mockResolvedValue({ token: 'active-token' } as any);
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'active-token',
      clientId: 8,
      createdById: 'user-1',
      usedAt: null,
      closedAt: null,
      uploadCount: 1,
      maxUploads: 5,
      expiresAt: new Date(Date.now() + 60_000),
      client: { firstName: 'Ana', lastName: 'Diaz' },
    } as any);
    documents.create.mockRejectedValue(new Error('create failed'));

    await expect(service.upload('active-token', {
      name: 'cedula',
      fileUrl: 'cedula.webp',
      fileSize: 100,
      mimeType: 'image/webp',
      uploadedFile: {
        filename: 'cedula.webp',
        originalname: 'cedula.webp',
        mimetype: 'image/webp',
      },
    })).rejects.toThrow('create failed');

    expect(prisma.documentCaptureSession.update).toHaveBeenCalledWith({
      where: { token: 'active-token' },
      data: { uploadCount: { decrement: 1 } },
    });
  });

  it('closes an active session', async () => {
    jest.mocked(prisma.documentCaptureSession.update).mockResolvedValue({ token: 'active-token' } as any);

    await service.close('active-token');

    expect(prisma.documentCaptureSession.update).toHaveBeenCalledWith({
      where: { token: 'active-token' },
      data: { closedAt: expect.any(Date) },
    });
  });

  it('returns an already closed session without updating it again', async () => {
    const closedAt = new Date();
    jest.mocked(prisma.documentCaptureSession.findUnique).mockResolvedValue({
      token: 'closed-token',
      closedAt,
    } as any);

    await expect(service.close('closed-token')).resolves.toMatchObject({ token: 'closed-token', closedAt });

    expect(prisma.documentCaptureSession.update).not.toHaveBeenCalled();
  });
});
