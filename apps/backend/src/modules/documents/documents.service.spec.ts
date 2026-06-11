import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentProcessingService } from './document-processing.service';
import { AuditService } from '../audit/audit.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    document: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
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

  it('resolves a stored file path for authenticated downloads', async () => {
    jest.mocked(prisma.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      fileUrl: 'receipt.pdf',
      name: 'Receipt',
      mimeType: 'application/pdf',
    } as any);

    await expect(service.getFileForDownload('doc-1')).resolves.toMatchObject({
      filename: 'Receipt',
      mimeType: 'application/pdf',
      path: expect.stringContaining('receipt.pdf'),
    });
  });

  it('throws NotFoundException when deleting a missing document', async () => {
    jest.mocked(prisma.document.findUnique).mockResolvedValue(null);

    await expect(service.remove('missing-doc', 'user-1')).rejects.toThrow(NotFoundException);

    expect(prisma.document.delete).not.toHaveBeenCalled();
  });
});
