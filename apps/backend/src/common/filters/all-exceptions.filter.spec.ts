import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const originalEnv = process.env;

  function createHost() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as any;

    return { host, status, json };
  }

  beforeEach(() => {
    process.env = { ...originalEnv };
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
});
