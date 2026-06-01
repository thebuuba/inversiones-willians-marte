import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '@inversiones/database';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  private createSession(user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    role: string;
  }) {
    const payload = { sub: user.id, username: user.username, email: user.email, role: user.role };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const login = dto.username.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: login }, { email: login }],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.active) throw new UnauthorizedException('Account is disabled');

    return this.createSession(user);
  }

  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: `${username}@usuarios.local` }],
      },
    });
    if (exists) throw new ConflictException('Nombre de usuario ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        name: dto.name.trim(),
        username,
        email: `${username}@usuarios.local`,
        passwordHash,
        role: 'ADMIN',
      },
    });

    return this.createSession(user);
  }

  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
    });
  }
}
