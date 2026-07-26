import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@inversiones/database';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const DUMMY_PASSWORD_HASH = '$2b$10$nS.iLnLwknJ.BwkYYIUrSepvR0dQ668/wJ92x.uuzyhmDqITylCf.';
const REFRESH_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

type SessionUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
};

function createRefreshToken() {
  return randomBytes(32).toString('base64url');
}

function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiry(now = new Date()) {
  return new Date(now.getTime() + REFRESH_SESSION_DURATION_MS);
}

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  private createAccessSession(user: SessionUser) {
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

  private async createPersistentSession(user: SessionUser) {
    const refreshToken = createRefreshToken();
    await prisma.authSession.create({
      data: {
        userId: user.id,
        familyId: randomUUID(),
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshExpiry(),
      },
    });

    return { ...this.createAccessSession(user), refreshToken };
  }

  async login(dto: LoginDto) {
    const login = dto.username.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { username: login } });
    const valid = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.active) throw new UnauthorizedException('Account is disabled');

    return this.createPersistentSession(user);
  }

  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { username } });
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

    return this.createAccessSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            active: true,
          },
        },
      },
    });
    const now = new Date();

    if (!session || session.revokedAt || session.expiresAt <= now || !session.user.active) {
      throw new UnauthorizedException('Session expired');
    }

    const nextRefreshToken = createRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);

    return prisma.$transaction(async (tx) => {
      const claimed = await tx.authSession.updateMany({
        where: {
          id: session.id,
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now, lastUsedAt: now },
      });
      if (claimed.count !== 1) throw new UnauthorizedException('Session expired');

      await tx.authSession.create({
        data: {
          userId: session.userId,
          familyId: session.familyId,
          tokenHash: nextTokenHash,
          expiresAt: getRefreshExpiry(now),
        },
      });

      return {
        ...this.createAccessSession(session.user),
        refreshToken: nextRefreshToken,
      };
    });
  }

  async logout(refreshToken: string) {
    await prisma.authSession.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
    });
  }
}
