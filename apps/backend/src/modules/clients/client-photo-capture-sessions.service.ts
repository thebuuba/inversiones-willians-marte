import {
  GoneException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { randomBytes } from 'crypto';
import { assertClientAccess, type PortfolioScope } from '../../common/portfolio-scope';

const CAPTURE_SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_PHOTO_DATA_LENGTH = 1_500_000;

interface CapturedPhotoInput {
  contents: Buffer;
  mimeType: string;
}

@Injectable()
export class ClientPhotoCaptureSessionsService {
  async create(clientId: number | undefined, createdById: string, scope: PortfolioScope) {
    if (clientId) {
      await assertClientAccess(scope, clientId);
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      });
      if (!client) throw new NotFoundException('Client not found');
    }

    await prisma.clientPhotoCaptureSession
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => undefined);

    const session = await prisma.clientPhotoCaptureSession.create({
      data: {
        token: randomBytes(24).toString('base64url'),
        clientId: clientId ?? null,
        createdById,
        expiresAt: new Date(Date.now() + CAPTURE_SESSION_TTL_MS),
      },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    return this.toSessionItem(session);
  }

  async findPublic(token: string) {
    const session = await this.findActive(token);
    return this.toSessionItem(session);
  }

  async getStatus(token: string, userId: string) {
    const session = await this.findOwned(token, userId);
    return this.toSessionItem(session);
  }

  async getPhoto(token: string, userId: string) {
    const session = await this.findOwned(token, userId);
    if (!session.photoData) throw new NotFoundException('Captured photo not found');
    return { photo: session.photoData };
  }

  async upload(token: string, input: CapturedPhotoInput) {
    const photoData = `data:${input.mimeType};base64,${input.contents.toString('base64')}`;
    if (photoData.length > MAX_PHOTO_DATA_LENGTH) {
      throw new PayloadTooLargeException('Captured photo is too large');
    }

    const updated = await prisma.clientPhotoCaptureSession.updateMany({
      where: {
        token,
        photoData: null,
        closedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { photoData, uploadedAt: new Date() },
    });

    if (updated.count === 0) {
      const existing = await prisma.clientPhotoCaptureSession.findUnique({ where: { token } });
      if (!existing) throw new NotFoundException('Photo capture session not found');
      throw new GoneException('Photo capture session expired');
    }

    return { uploaded: true };
  }

  async close(token: string, userId: string) {
    const session = await prisma.clientPhotoCaptureSession.findFirst({
      where: { token, createdById: userId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Photo capture session not found');

    await prisma.clientPhotoCaptureSession.delete({ where: { id: session.id } });
    return { closed: true };
  }

  private async findActive(token: string) {
    const session = await prisma.clientPhotoCaptureSession.findUnique({
      where: { token },
      include: { client: { select: { firstName: true, lastName: true } } },
    });
    if (!session) throw new NotFoundException('Photo capture session not found');
    if (session.closedAt || session.expiresAt.getTime() <= Date.now() || session.photoData) {
      throw new GoneException('Photo capture session expired');
    }
    return session;
  }

  private async findOwned(token: string, userId: string) {
    const session = await prisma.clientPhotoCaptureSession.findFirst({
      where: { token, createdById: userId },
      include: { client: { select: { firstName: true, lastName: true } } },
    });
    if (!session) throw new NotFoundException('Photo capture session not found');
    if (session.closedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Photo capture session expired');
    }
    return session;
  }

  private toSessionItem(session: {
    token: string;
    clientId: number | null;
    expiresAt: Date;
    photoData: string | null;
    client: { firstName: string; lastName: string } | null;
  }) {
    return {
      token: session.token,
      clientId: session.clientId ?? undefined,
      clientName: session.client
        ? `${session.client.firstName} ${session.client.lastName}`.trim()
        : 'Nuevo cliente',
      expiresAt: session.expiresAt.toISOString(),
      photoReady: Boolean(session.photoData),
    };
  }
}
