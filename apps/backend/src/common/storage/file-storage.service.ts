import { Injectable } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

export interface R2StoredObject {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2BucketBinding {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<R2StoredObject | null>;
  delete(key: string | string[]): Promise<void>;
}

let workerBucket: R2BucketBinding | undefined;

export function configureR2Bucket(bucket: R2BucketBinding | undefined) {
  workerBucket = bucket;
}

@Injectable()
export class FileStorageService {
  private readonly uploadsDir = join(process.cwd(), 'uploads');

  async put(key: string, contents: Buffer, contentType?: string) {
    const safeKey = this.normalizeKey(key);
    if (workerBucket) {
      await workerBucket.put(safeKey, contents, {
        httpMetadata: contentType ? { contentType } : undefined,
      });
      return;
    }

    const path = this.localPath(safeKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }

  async get(key: string) {
    const safeKey = this.normalizeKey(key);
    if (workerBucket) {
      const object = await workerBucket.get(safeKey);
      return object ? Buffer.from(await object.arrayBuffer()) : null;
    }

    try {
      return await readFile(this.localPath(safeKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async delete(keys: string | string[]) {
    const safeKeys = [
      ...new Set((Array.isArray(keys) ? keys : [keys]).map((key) => this.normalizeKey(key))),
    ];
    if (safeKeys.length === 0) return;

    if (workerBucket) {
      await workerBucket.delete(safeKeys.length === 1 ? safeKeys[0] : safeKeys);
      return;
    }

    await Promise.all(
      safeKeys.map(async (key) => {
        try {
          await unlink(this.localPath(key));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }),
    );
  }

  private normalizeKey(key: string) {
    const normalized = key.replaceAll('\\', '/').replace(/^\/+/, '');
    const segments = normalized.split('/');
    if (
      !normalized ||
      segments.some((segment) => !segment || segment === '.' || segment === '..')
    ) {
      throw new Error('Invalid storage key');
    }
    return normalized;
  }

  private localPath(key: string) {
    const root = resolve(this.uploadsDir);
    const path = resolve(root, key);
    if (!path.startsWith(`${root}${sep}`)) throw new Error('Invalid storage key');
    return path;
  }
}
