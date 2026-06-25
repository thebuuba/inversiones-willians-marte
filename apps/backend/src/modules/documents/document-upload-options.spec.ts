import { CAPTURE_UPLOAD_LIMITS, DOCUMENT_UPLOAD_LIMITS } from './document-upload-options';

describe('document upload options', () => {
  it('limits multipart payload shape for authenticated and public uploads', () => {
    expect(DOCUMENT_UPLOAD_LIMITS).toMatchObject({
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fields: 8,
      parts: 12,
    });
    expect(CAPTURE_UPLOAD_LIMITS).toMatchObject({
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fields: 0,
      parts: 2,
    });
  });
});
