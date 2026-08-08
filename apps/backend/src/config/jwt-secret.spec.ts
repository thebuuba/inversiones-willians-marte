import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
    delete process.env.RAILWAY_SERVICE_ID;
    delete process.env.RAILWAY_PROJECT_ID;
    delete process.env.RAILWAY_ENVIRONMENT_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses JWT_SECRET when it is configured', () => {
    const config = { get: jest.fn().mockReturnValue(' configured-secret ') };

    expect(getJwtSecret(config)).toBe('configured-secret');
  });

  it('throws in production on Railway when JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.RAILWAY_SERVICE_ID = 'service-id';
    process.env.RAILWAY_PROJECT_ID = 'project-id';
    process.env.RAILWAY_ENVIRONMENT_ID = 'environment-id';
    const config = { get: jest.fn().mockReturnValue(undefined) };

    expect(() => getJwtSecret(config)).toThrow('JWT_SECRET is required in production');
  });

  it('throws in production outside Railway when JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    const config = { get: jest.fn().mockReturnValue(undefined) };

    expect(() => getJwtSecret(config)).toThrow('JWT_SECRET is required in production');
  });

  it('falls back to the dev secret only in explicit development or test environments', () => {
    process.env.NODE_ENV = 'development';
    const config = { get: jest.fn().mockReturnValue(undefined) };

    expect(getJwtSecret(config)).toBe('inversiones-willians-marte-dev-secret');
  });

  it('fails closed when NODE_ENV is unset and JWT_SECRET is missing', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };

    expect(() => getJwtSecret(config)).toThrow('JWT_SECRET is required in production');
  });
});
