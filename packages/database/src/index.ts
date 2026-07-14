import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const requestPrisma = new AsyncLocalStorage<PrismaClient>();
const globalForPrisma = globalThis as unknown as { nodePrisma: PrismaClient | undefined };

export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const adapter = new PrismaPg({
    connectionString,
    max: 3,
  });

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

function getPrismaClient() {
  const scopedClient = requestPrisma.getStore();
  if (scopedClient) return scopedClient;

  globalForPrisma.nodePrisma ??= createPrismaClient();
  return globalForPrisma.nodePrisma;
}

export function runWithPrismaClient<T>(client: PrismaClient, callback: () => T): T {
  return requestPrisma.run(client, callback);
}

export async function disconnectPrismaClient() {
  const client = globalForPrisma.nodePrisma;
  globalForPrisma.nodePrisma = undefined;
  if (client) await client.$disconnect();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client) as unknown;
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export * from '@prisma/client';
