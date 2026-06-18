import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const originalEnv = process.env;
  let errorSpy: jest.SpiedFunction<Logger['error']>;
  let warnSpy: jest.SpiedFunction<Logger['warn']>;

  function createHost(request: Record<string, unknown> = {}) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const setHeader = jest.fn();
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ setHeader, status }),
      }),
    } as any;

    return { host, setHeader, status, json };
  }

  beforeEach(() => {
    process.env = { ...originalEnv };
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('hides unexpected error messages in production', () => {
    process.env.NODE_ENV = 'production';
    const { host, json } = createHost();

    new AllExceptionsFilter().catch(new Error('database password leaked'), host);

    expect(json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it('keeps controlled HTTP exception messages', () => {
    process.env.NODE_ENV = 'production';
    const { host, json } = createHost();

    new AllExceptionsFilter().catch(new HttpException('Bad request', HttpStatus.BAD_REQUEST), host);

    expect(json).toHaveBeenCalledWith({
      success: false,
      error: 'Bad request',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('returns request id and logs operational context without exposing production error text', () => {
    process.env.NODE_ENV = 'production';
    const { host, json, setHeader } = createHost({
      id: 'req-1',
      method: 'POST',
      originalUrl: '/api/v1/payments',
      user: { id: 'user-1' },
    });

    new AllExceptionsFilter().catch(new Error('database password leaked'), host);

    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'req-1');
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      requestId: 'req-1',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('POST /api/v1/payments status=500 requestId=req-1 userId=user-1'),
      expect.any(String),
    );
    expect(errorSpy.mock.calls[0][0]).not.toContain('database password leaked');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
