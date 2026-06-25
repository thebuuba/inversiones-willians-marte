import { isAllowedFileSignature } from './document-upload-validation';

describe('document upload validation', () => {
  it('rejects a spoofed image upload', () => {
    expect(isAllowedFileSignature('image/png', Buffer.from('not a png'))).toBe(false);
  });

  it('accepts common allowed file signatures', () => {
    expect(isAllowedFileSignature('application/pdf', Buffer.from('%PDF-1.7'))).toBe(true);
    expect(
      isAllowedFileSignature(
        'image/png',
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true);
    expect(isAllowedFileSignature('image/jpeg', Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(isAllowedFileSignature('image/webp', Buffer.from('RIFFxxxxWEBP'))).toBe(true);
  });
});
