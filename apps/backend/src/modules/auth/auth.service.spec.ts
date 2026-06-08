import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('@inversiones/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import * as bcrypt from 'bcryptjs';
import { prisma } from '@inversiones/database';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: '1',
    name: 'Test User',
    username: 'testuser',
    email: 'testuser@usuarios.local',
    role: 'ADMIN',
    active: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return token and user on valid credentials', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const dto: LoginDto = { username: 'testuser', password: 'password123' };
      const result = await service.login(dto);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('testuser@usuarios.local');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const dto: LoginDto = { username: 'testuser', password: 'wrong' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const dto: LoginDto = { username: 'nobody', password: 'password123' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is disabled', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue({ ...mockUser, active: false } as any);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const dto: LoginDto = { username: 'testuser', password: 'password123' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user and return session', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(null);
      jest.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const dto: RegisterDto = { name: 'Test User', username: 'testuser', password: 'password123' };
      const result = await service.register(dto);

      expect(result.accessToken).toBe('mock-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ username: 'testuser' }),
        }),
      );
    });

    it('should throw ConflictException when username exists', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      const dto: RegisterDto = { name: 'Test User', username: 'testuser', password: 'password123' };
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without sensitive fields', async () => {
      const profile = {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@test.com',
        role: 'ADMIN',
        createdAt: new Date(),
      };
      jest.mocked(prisma.user.findUnique).mockResolvedValue(profile as any);

      const result = await service.getProfile('1');
      expect(result).toEqual(profile);
    });
  });
});
