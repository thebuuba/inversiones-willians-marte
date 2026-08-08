import { applyWorkerEnvironment, resolveWorkerDatabaseUrl } from './worker-env';

describe('Cloudflare worker environment', () => {
  const originalEnv = process.env;
  const documentsBucket = {
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

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
      DOCUMENTS_BUCKET: documentsBucket,
      DATABASE_URL: 'postgresql://local/database',
      JWT_SECRET: 'worker-secret',
      FRONTEND_URL: 'https://staging.example.com',
      NODE_ENV: 'production',
    });

    expect(process.env).toMatchObject({
      CLOUDFLARE_WORKER: 'true',
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://local/database',
      JWT_SECRET: 'worker-secret',
      FRONTEND_URL: 'https://staging.example.com',
    });
  });

  it('defaults to production when NODE_ENV is not provided', () => {
    applyWorkerEnvironment({
      DOCUMENTS_BUCKET: documentsBucket,
      DATABASE_URL: 'postgresql://local/database',
      JWT_SECRET: 'worker-secret',
    });

    expect(process.env.NODE_ENV).toBe('production');
  });

  it('fails closed when the JWT secret is missing', () => {
    expect(() =>
      applyWorkerEnvironment({
        DOCUMENTS_BUCKET: documentsBucket,
        DATABASE_URL: 'postgresql://local/database',
        JWT_SECRET: '',
      }),
    ).toThrow('Configure the JWT_SECRET Worker secret');
  });

  it('fails closed when the private R2 bucket binding is missing', () => {
    expect(() =>
      applyWorkerEnvironment({
        DATABASE_URL: 'postgresql://local/database',
        JWT_SECRET: 'worker-secret',
      }),
    ).toThrow('Configure the DOCUMENTS_BUCKET R2 binding');
  });
});
