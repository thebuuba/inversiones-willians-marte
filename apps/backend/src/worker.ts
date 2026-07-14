import 'reflect-metadata';
import { createServer, type RequestListener } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { createPrismaClient, runWithPrismaClient } from '@inversiones/database';
import { configureNestApplication } from './bootstrap';
import { CloudflareProbeModule } from './cloudflare/cloudflare-probe.module';
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

  const adapter = new ExpressAdapter();
  const app = await NestFactory.create<NestExpressApplication>(CloudflareProbeModule, adapter, {
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
