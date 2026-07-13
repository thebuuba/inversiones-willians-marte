import { access, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@inversiones/database';
import { ClientPhotoCaptureSessionsService } from './client-photo-capture-sessions.service';

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

    await expect(service.create(undefined, 'user-1')).resolves.toMatchObject({
      token: 'photo-token',
      clientName: 'Nuevo cliente',
      photoReady: false,
    });
    expect(prisma.client.findUnique).not.toHaveBeenCalled();
  });

  it('stores the captured image as a data URL and removes the temporary file', async () => {
    const uploadsDir = join(__dirname, '..', '..', '..', 'uploads');
    const filename = `client-photo-capture-${Date.now()}.png`;
    const path = join(uploadsDir, filename);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path, Buffer.from('photo'));
    jest.mocked(prisma.clientPhotoCaptureSession.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      service.upload('photo-token', { filename, mimeType: 'image/png' }),
    ).resolves.toEqual({ uploaded: true });
    expect(prisma.clientPhotoCaptureSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ photoData: 'data:image/png;base64,cGhvdG8=' }),
      }),
    );
    await expect(access(path)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
