import { applyWorkerEnvironment, resolveWorkerDatabaseUrl } from './worker-env';

describe('Cloudflare worker environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('prefers the Hyperdrive connection string', () => {
    expect(
      resolveWorkerDatabaseUrl({
        HYPERDRIVE: { connectionString: 'postgresql://hyperdrive/database' },
        DATABASE_URL: 'postgresql://fallback/database',
        JWT_SECRET: 'secret',
      }),
    ).toBe('postgresql://hyperdrive/database');
  });

  it('allows DATABASE_URL for local development', () => {
    expect(
      resolveWorkerDatabaseUrl({
        DATABASE_URL: 'postgresql://local/database',
        JWT_SECRET: 'secret',
      }),
    ).toBe('postgresql://local/database');
  });

  it('fails clearly when no database binding is configured', () => {
    expect(() => resolveWorkerDatabaseUrl({ JWT_SECRET: 'secret' })).toThrow(
      'Configure the HYPERDRIVE binding or DATABASE_URL secret',
    );
  });

  it('copies Worker bindings into the Node-compatible environment', () => {
    applyWorkerEnvironment({
      DATABASE_URL: 'postgresql://local/database',
      JWT_SECRET: 'worker-secret',
      FRONTEND_URL: 'https://staging.example.com',
    });

    expect(process.env).toMatchObject({
      CLOUDFLARE_WORKER: 'true',
      DATABASE_URL: 'postgresql://local/database',
      JWT_SECRET: 'worker-secret',
      FRONTEND_URL: 'https://staging.example.com',
    });
  });
});
