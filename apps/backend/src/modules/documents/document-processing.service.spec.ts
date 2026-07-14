import { DocumentProcessingService } from './document-processing.service';
import { configureDocumentImageProcessor } from './document-image-processor';
import { configureSharpDocumentImageProcessor } from './node-sharp-document-processor';

describe('DocumentProcessingService', () => {
  let service: DocumentProcessingService;

  beforeEach(() => {
    service = new DocumentProcessingService();
  });

  afterEach(() => {
    configureDocumentImageProcessor(undefined);
  });

  it('detects cedula documents from filename hints', async () => {
    await expect(
      service.analyze({
        filename: 'stored.webp',
        originalname: 'cedula-frontal-juan.jpg',
        mimetype: 'image/jpeg',
      }),
    ).resolves.toMatchObject({
      originalFileUrl: 'stored.webp',
      documentType: 'cedula',
      detectionConfidence: 92,
      processingStatus: 'needs_review',
    });
  });

  it('detects cedula documents when the filename has accents', async () => {
    await expect(
      service.analyze({
        filename: 'stored.webp',
        originalname: 'cédula reverso.jpg',
        mimetype: 'image/jpeg',
      }),
    ).resolves.toMatchObject({
      documentType: 'cedula',
      detectionConfidence: 92,
    });
  });

  it('detects recibo documents from filename hints', async () => {
    await expect(
      service.analyze({
        filename: 'receipt.png',
        originalname: 'comprobante pago banco popular.png',
        mimetype: 'image/png',
      }),
    ).resolves.toMatchObject({
      documentType: 'recibo',
      detectionConfidence: 88,
      processingStatus: 'needs_review',
    });
  });

  it('detects acto notarial documents from filename hints', async () => {
    await expect(
      service.analyze({
        filename: 'acto.pdf',
        originalname: 'acto notarial prestamo.pdf',
        mimetype: 'application/pdf',
      }),
    ).resolves.toMatchObject({
      documentType: 'acto_notarial',
      detectionConfidence: 90,
      processingStatus: 'not_applicable',
    });
  });

  it('marks unknown images as needs_review', async () => {
    await expect(
      service.analyze({
        filename: 'upload.jpg',
        originalname: 'foto sin nombre.jpg',
        mimetype: 'image/jpeg',
      }),
    ).resolves.toMatchObject({
      documentType: 'otro',
      detectionConfidence: 35,
      processingStatus: 'needs_review',
    });
  });

  it('marks PDFs as not_applicable for crop processing', async () => {
    await expect(
      service.analyze({
        filename: 'document.pdf',
        originalname: 'documento general.pdf',
        mimetype: 'application/pdf',
      }),
    ).resolves.toMatchObject({
      originalFileUrl: 'document.pdf',
      documentType: 'otro',
      detectionConfidence: 20,
      processingStatus: 'not_applicable',
    });
  });

  it('uses the Node image processor when it is configured', async () => {
    configureSharpDocumentImageProcessor();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    await expect(
      service.analyze({
        filename: 'documents/cedula.png',
        originalname: 'cedula.png',
        mimetype: 'image/png',
        buffer: png,
      }),
    ).resolves.toMatchObject({
      processedFileUrl: 'cedula-processed.webp',
      processedContents: expect.any(Buffer),
      processingStatus: 'processed',
    });
  });
});
