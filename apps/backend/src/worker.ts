import 'reflect-metadata';
import { createServer, type RequestListener } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { createPrismaClient, runWithPrismaClient } from '@inversiones/database';
import { configureNestApplication } from './bootstrap';
import { configureR2Bucket } from './common/storage/file-storage.service';
import {
  applyWorkerEnvironment,
  CloudflareWorkerEnv,
  resolveWorkerDatabaseUrl,
} from './cloudflare/worker-env';

const NEST_PORT = 3000;
let bootstrapPromise: Promise<void> | undefined;

export type HandleAsNodeRequest = (port: number, request: Request) => Promise<Response>;

async function bootstrapWorker(env: CloudflareWorkerEnv) {
  applyWorkerEnvironment(env);
  configureR2Bucket(env.DOCUMENTS_BUCKET);
  const { AppModule } = await import('./app.module.js');

  const adapter = new ExpressAdapter();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
    abortOnError: false,
    bodyParser: false,
  });
  configureNestApplication(app);
  await app.init();

  const server = createServer(adapter.getInstance<RequestListener>());
  server.listen(NEST_PORT);
}

async function ensureWorkerStarted(env: CloudflareWorkerEnv) {
  bootstrapPromise ??= bootstrapWorker(env);
  await bootstrapPromise;
}

export function createWorkerHandler(handleAsNodeRequest: HandleAsNodeRequest) {
  return {
    async fetch(request: Request, env: CloudflareWorkerEnv): Promise<Response> {
      await ensureWorkerStarted(env);

      const client = createPrismaClient(resolveWorkerDatabaseUrl(env));
      return runWithPrismaClient(client, async () => {
        try {
          return await handleAsNodeRequest(NEST_PORT, request);
        } finally {
          await client.$disconnect();
        }
      });
    },
  };
}
