import type { R2BucketBinding } from '../common/storage/file-storage.service';

export interface HyperdriveBinding {
  connectionString: string;
}

export interface CloudflareWorkerEnv {
  HYPERDRIVE?: HyperdriveBinding;
  DOCUMENTS_BUCKET?: R2BucketBinding;
  DATABASE_URL?: string;
  JWT_SECRET: string;
  FRONTEND_URL?: string;
  NODE_ENV?: string;
}

export function resolveWorkerDatabaseUrl(env: CloudflareWorkerEnv) {
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Configure the HYPERDRIVE binding or DATABASE_URL secret');
  }
  return connectionString;
}

export function applyWorkerEnvironment(env: CloudflareWorkerEnv) {
  if (!env.DOCUMENTS_BUCKET) {
    throw new Error('Configure the DOCUMENTS_BUCKET R2 binding');
  }
  process.env.CLOUDFLARE_WORKER = 'true';
  process.env.DATABASE_URL = resolveWorkerDatabaseUrl(env);
  if (!env.JWT_SECRET?.trim()) throw new Error('Configure the JWT_SECRET Worker secret');
  process.env.JWT_SECRET = env.JWT_SECRET.trim();
  if (env.FRONTEND_URL) process.env.FRONTEND_URL = env.FRONTEND_URL;
}
