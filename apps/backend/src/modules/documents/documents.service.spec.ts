import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentProcessingService } from './document-processing.service';
import { AuditService } from '../audit/audit.service';
import { prisma } from '@inversiones/database';
import { access, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

jest.mock('@inversiones/database', () => ({
  prisma: {
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('DocumentsService', () => {
  const audit = { log: jest.fn() };
  const documentProcessing = { analyze: jest.fn() };
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: AuditService, useValue: audit },
        { provide: DocumentProcessingService, useValue: documentProcessing },
      ],
    }).compile();
    service = module.get(DocumentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('persists processing metadata when creating a document with an uploaded file', async () => {
    documentProcessing.analyze.mockResolvedValue({
      originalFileUrl: 'stored.webp',
      documentType: 'cedula',
      detectionConfidence: 92,
      processingStatus: 'needs_review',
      processingNotes: 'Documento detectado; recorte automatico pendiente de motor de imagen.',
    });
    jest.mocked(prisma.document.create).mockResolvedValue({ id: 'doc-1' } as any);

    await service.create(
      {
        name: 'Cedula',
        category: 'general',
        clientId: 7,
        fileUrl: 'stored.webp',
        fileSize: 12345,
        mimeType: 'image/webp',
        uploadedFile: {
          filename: 'stored.webp',
          originalname: 'cedula juan.jpg',
          mimetype: 'image/jpeg',
        },
      },
      'user-1',
    );

    expect(documentProcessing.analyze).toHaveBeenCalledWith({
      filename: 'stored.webp',
      originalname: 'cedula juan.jpg',
      mimetype: 'image/jpeg',
    });
    expect(prisma.document.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: 7,
        fileUrl: 'stored.webp',
        originalFileUrl: 'stored.webp',
        documentType: 'cedula',
        detectionConfidence: 92,
        processingStatus: 'needs_review',
        processingNotes: 'Documento detectado; recorte automatico pendiente de motor de imagen.',
      }),
    });
  });

  it('logs the client document name when deleting an attachment', async () => {
    jest
      .mocked(prisma.document.findUnique)
      .mockResolvedValue({ id: 'doc-1', clientId: 7, name: 'Cédula' } as any);
    jest.mocked(prisma.document.delete).mockResolvedValue({ id: 'doc-1' } as any);

    await service.remove('doc-1', 'user-1');

    expect(audit.log).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: 7,
      entityType: 'Document',
      entityId: 'doc-1',
      action: 'DOCUMENT_DELETED',
      newValues: { name: 'Cédula' },
    });
  });

  it('removes the stored original and processed files when deleting a document', async () => {
    const uploadsDir = join(__dirname, '..', '..', '..', 'uploads');
    const originalName = `document-delete-${Date.now()}.jpg`;
    const processedName = `document-delete-${Date.now()}-processed.webp`;
    const originalPath = join(uploadsDir, originalName);
    const processedPath = join(uploadsDir, processedName);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(originalPath, 'original');
    await writeFile(processedPath, 'processed');

    jest.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-files',
      clientId: null,
      name: 'Documento',
      fileUrl: originalName,
      originalFileUrl: originalName,
      processedFileUrl: processedName,
    } as any);
    jest.mocked(prisma.document.delete).mockResolvedValue({ id: 'doc-files' } as any);

    try {
      await service.remove('doc-files', 'user-1');
      await expect(access(originalPath)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(access(processedPath)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(originalPath, { force: true });
      await rm(processedPath, { force: true });
    }
  });

  it('renames a client document and records the old and new names', async () => {
    jest.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      clientId: 7,
      name: 'Documento sin nombre',
    } as any);
    jest.mocked(prisma.document.update).mockResolvedValue({
      id: 'doc-1',
      clientId: 7,
      name: 'Cédula frontal',
    } as any);

    await expect(
      service.updateName('doc-1', '  Cédula frontal  ', 'user-1'),
    ).resolves.toMatchObject({
      name: 'Cédula frontal',
    });
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { name: 'Cédula frontal' },
    });
    expect(audit.log).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: 7,
      entityType: 'Document',
      entityId: 'doc-1',
      action: 'DOCUMENT_RENAMED',
      oldValues: { name: 'Documento sin nombre' },
      newValues: { name: 'Cédula frontal' },
    });
  });

  it('lists documents without reprocessing pending images', async () => {
    const document = {
      id: 'doc-1',
      name: 'Cedula',
      clientId: 7,
      fileUrl: 'cedula.webp',
      mimeType: 'image/webp',
      processedFileUrl: null,
      processingStatus: 'needs_review',
    };
    jest.mocked(prisma.document.findMany).mockResolvedValue([document] as any);

    await expect(service.findAll(7)).resolves.toEqual([document]);

    expect(documentProcessing.analyze).not.toHaveBeenCalled();
    expect(prisma.document.update).not.toHaveBeenCalled();
  });

  it('resolves a stored file path for authenticated downloads', async () => {
    const uploadsDir = join(__dirname, '..', '..', '..', 'uploads');
    const storedName = `receipt-${Date.now()}.pdf`;
    const storedPath = join(uploadsDir, storedName);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(storedPath, 'receipt');

    jest.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      fileUrl: storedName,
      name: 'Receipt',
      mimeType: 'application/pdf',
    } as any);

    try {
      await expect(service.getFileForDownload('doc-1')).resolves.toMatchObject({
        filename: 'Receipt',
        mimeType: 'application/pdf',
        path: storedPath,
      });
    } finally {
      await rm(storedPath, { force: true });
    }
  });

  it('falls back to the original file when the processed variant is missing', async () => {
    const uploadsDir = join(__dirname, '..', '..', '..', 'uploads');
    const originalName = `document-fallback-${Date.now()}.jpg`;
    const originalPath = join(uploadsDir, originalName);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(originalPath, 'original');

    jest.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-fallback',
      fileUrl: originalName,
      processedFileUrl: `${originalName}-missing.webp`,
      name: 'Cédula',
      mimeType: 'image/jpeg',
    } as any);

    try {
      await expect(service.getFileForDownload('doc-fallback', true)).resolves.toMatchObject({
        path: originalPath,
        mimeType: 'image/jpeg',
      });
    } finally {
      await rm(originalPath, { force: true });
    }
  });

  it('throws NotFoundException when every stored file variant is missing', async () => {
    jest.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-missing-file',
      fileUrl: 'missing-original.jpg',
      processedFileUrl: 'missing-processed.webp',
      name: 'Cédula',
      mimeType: 'image/jpeg',
    } as any);

    await expect(service.getFileForDownload('doc-missing-file', true)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when deleting a missing document', async () => {
    jest.mocked(prisma.document.findUnique).mockResolvedValue(null);

    await expect(service.remove('missing-doc', 'user-1')).rejects.toThrow(NotFoundException);

    expect(prisma.document.delete).not.toHaveBeenCalled();
  });
});
