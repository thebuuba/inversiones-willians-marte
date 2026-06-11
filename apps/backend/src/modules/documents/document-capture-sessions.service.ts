import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { randomBytes } from 'crypto';
import { DocumentsService } from './documents.service';
import { UploadedDocumentFile } from './document-processing.service';

const CAPTURE_SESSION_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MAX_UPLOADS = 5;

interface CaptureUploadInput {
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedFile: UploadedDocumentFile;
}

@Injectable()
export class DocumentCaptureSessionsService {
  constructor(private documents: DocumentsService) {}

  async create(clientId: number, createdById: string) {
    const session = await prisma.documentCaptureSession.create({
      data: {
        token: this.generateToken(),
        clientId,
        createdById,
        expiresAt: new Date(Date.now() + CAPTURE_SESSION_TTL_MS),
        maxUploads: DEFAULT_MAX_UPLOADS,
      },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    return this.toSessionItem(session);
  }

  async findActive(token: string) {
    const session = await this.getActiveSession(token);
    return this.toSessionItem(session);
  }

  async upload(token: string, input: CaptureUploadInput) {
    const session = await this.getActiveSession(token);

    const document = await this.documents.create(
      {
        name: input.name,
        category: 'general',
        clientId: session.clientId,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        uploadedFile: input.uploadedFile,
      },
      session.createdById,
    );

    await prisma.documentCaptureSession.update({
      where: { token },
      data: { uploadCount: { increment: 1 } },
    });

    return document;
  }

  async close(token: string) {
    return prisma.documentCaptureSession.update({
      where: { token },
      data: { closedAt: new Date() },
    });
  }

  private async getActiveSession(token: string) {
    const session = await prisma.documentCaptureSession.findUnique({
      where: { token },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    if (!session) throw new NotFoundException('Capture session not found');
    if (
      session.usedAt ||
      session.closedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.uploadCount >= session.maxUploads
    ) {
      throw new GoneException('Capture session expired');
    }

    return session;
  }

  private toSessionItem(session: {
    token: string;
    clientId: number;
    expiresAt: Date;
    uploadCount?: number;
    maxUploads?: number;
    client: { firstName: string; lastName: string };
  }) {
    return {
      token: session.token,
      clientId: session.clientId,
      clientName: `${session.client.firstName} ${session.client.lastName}`.trim(),
      expiresAt: session.expiresAt.toISOString(),
      uploadCount: session.uploadCount,
      maxUploads: session.maxUploads,
    };
  }

  private generateToken() {
    return randomBytes(24).toString('base64url');
  }
}
