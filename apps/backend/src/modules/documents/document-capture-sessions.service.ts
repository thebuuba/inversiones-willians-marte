import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { randomBytes } from 'crypto';
import { DocumentsService } from './documents.service';
import { UploadedDocumentFile } from './document-processing.service';

const CAPTURE_SESSION_TTL_MS = 10 * 60 * 1000;

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

    return document;
  }

  private async getActiveSession(token: string) {
    const session = await prisma.documentCaptureSession.findUnique({
      where: { token },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    if (!session) throw new NotFoundException('Capture session not found');
    if (session.usedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Capture session expired');
    }

    return session;
  }

  private toSessionItem(session: {
    token: string;
    clientId: number;
    expiresAt: Date;
    client: { firstName: string; lastName: string };
  }) {
    return {
      token: session.token,
      clientId: session.clientId,
      clientName: `${session.client.firstName} ${session.client.lastName}`.trim(),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  private generateToken() {
    return randomBytes(24).toString('base64url');
  }
}
