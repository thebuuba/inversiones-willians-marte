import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export function createDocumentStorageKey(originalName: string, prefix = 'documents/originals') {
  const extension = extname(originalName).toLowerCase();
  return `${prefix}/${randomUUID()}${extension}`;
}
