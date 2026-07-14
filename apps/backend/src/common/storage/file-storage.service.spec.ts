import {
  FileStorageService,
  configureR2Bucket,
  type R2BucketBinding,
} from './file-storage.service';

describe('FileStorageService', () => {
  afterEach(() => configureR2Bucket(undefined));

  it('stores, reads and deletes objects through an R2 binding', async () => {
    const objects = new Map<string, Buffer>();
    const bucket: R2BucketBinding = {
      put: jest.fn((key, value) => {
        objects.set(key, Buffer.from(value as ArrayBufferView));
        return Promise.resolve();
      }),
      get: jest.fn((key) => {
        const value = objects.get(key);
        return Promise.resolve(
          value ? { arrayBuffer: () => Promise.resolve(Uint8Array.from(value).buffer) } : null,
        );
      }),
      delete: jest.fn((key) => {
        for (const item of Array.isArray(key) ? key : [key]) objects.delete(item);
        return Promise.resolve();
      }),
    };
    configureR2Bucket(bucket);
    const storage = new FileStorageService();

    await storage.put('documents/doc-1/original.pdf', Buffer.from('document'), 'application/pdf');
    await expect(storage.get('documents/doc-1/original.pdf')).resolves.toEqual(
      Buffer.from('document'),
    );
    await storage.delete('documents/doc-1/original.pdf');
    await expect(storage.get('documents/doc-1/original.pdf')).resolves.toBeNull();

    expect(bucket.put).toHaveBeenCalledWith(
      'documents/doc-1/original.pdf',
      Buffer.from('document'),
      {
        httpMetadata: { contentType: 'application/pdf' },
      },
    );
  });

  it('rejects path traversal keys', async () => {
    const storage = new FileStorageService();
    await expect(storage.put('../secret', Buffer.from('nope'))).rejects.toThrow(
      'Invalid storage key',
    );
  });
});
