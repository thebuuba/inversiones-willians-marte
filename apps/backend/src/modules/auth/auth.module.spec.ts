import { ConfigService } from '@nestjs/config';
import { getAuthJwtOptions } from './auth.module';

describe('AuthModule', () => {
  it('expires issued sessions automatically', () => {
    const options = getAuthJwtOptions({
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService);

    expect(options.signOptions).toEqual({ expiresIn: '15m' });
  });
});
