import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';

describe('password policy', () => {
  it('requires at least 10 characters for login passwords', async () => {
    const dto = Object.assign(new LoginDto(), { username: 'admin', password: 'short9' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('requires at least 10 characters for registered users', async () => {
    const dto = Object.assign(new RegisterDto(), {
      name: 'Admin',
      username: 'admin',
      password: 'short9',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('requires at least 10 characters for created users', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      name: 'Collector',
      username: 'collector',
      email: 'collector@example.com',
      password: 'short9',
      role: 'COLLECTOR',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});
