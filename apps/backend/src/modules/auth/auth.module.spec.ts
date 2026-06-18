import { ConfigService } from '@nestjs/config';
import { getAuthJwtOptions } from './auth.module';

describe('AuthModule', () => {
  it('does not expire issued sessions automatically', () => {
    const options = getAuthJwtOptions({
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService);

    expect(options.signOptions).toBeUndefined();
  });
});
