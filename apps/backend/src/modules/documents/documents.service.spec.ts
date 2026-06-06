import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { AuditService } from '../audit/audit.service';
import { prisma } from '@inversiones/database';

jest.mock('@inversiones/database', () => ({
  prisma: {
    document: { findUnique: jest.fn(), delete: jest.fn() },
  },
}));

describe('DocumentsService', () => {
  const audit = { log: jest.fn() };
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService, { provide: AuditService, useValue: audit }],
    }).compile();
    service = module.get(DocumentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('logs the client document name when deleting an attachment', async () => {
    jest.mocked(prisma.document.findUnique).mockResolvedValue({ id: 'doc-1', clientId: 7, name: 'Cédula' } as any);
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
});
