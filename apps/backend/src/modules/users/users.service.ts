import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@inversiones/database';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto, actorUserId?: string) {
    const username = dto.username.trim().toLowerCase();
    const email = `${username}@usuarios.local`;
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) throw new ConflictException('Nombre de usuario ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await prisma.user.create({
      data: {
        name: dto.name.trim(),
        username,
        email,
        passwordHash,
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          newValues: {
            name: user.name,
            username: user.username ?? null,
            email: user.email,
            role: user.role,
            active: user.active,
          },
        },
      });
    }

    return user;
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleActive(id: string, actorUserId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: { id: true, name: true, username: true, email: true, role: true, active: true },
    });

    if (!updated.active) {
      await prisma.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'USER_ACTIVE_TOGGLED',
          entityType: 'User',
          entityId: id,
          oldValues: { active: user.active },
          newValues: { active: updated.active },
        },
      });
    }

    return updated;
  }

  async getPortfolioAssignments(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const assignments = await prisma.userPortfolio.findMany({
      where: { userId },
      select: { portfolioId: true },
    });

    return { portfolioIds: assignments.map((assignment) => assignment.portfolioId) };
  }

  async updatePortfolioAssignments(userId: string, portfolioIds: string[], actorUserId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Los administradores no necesitan carteras asignadas');
    }

    const uniqueIds = [...new Set(portfolioIds)];
    const previous = await prisma.userPortfolio.findMany({
      where: { userId },
      select: { portfolioId: true },
    });
    if (uniqueIds.length > 0) {
      const portfolios = await prisma.portfolio.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      if (portfolios.length !== uniqueIds.length) {
        throw new NotFoundException('Alguna cartera no existe');
      }
    }

    await prisma.$transaction([
      prisma.userPortfolio.deleteMany({ where: { userId } }),
      ...(uniqueIds.length > 0
        ? [
            prisma.userPortfolio.createMany({
              data: uniqueIds.map((portfolioId) => ({ userId, portfolioId })),
            }),
          ]
        : []),
    ]);

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'PORTFOLIO_ASSIGNMENTS_UPDATED',
          entityType: 'User',
          entityId: userId,
          oldValues: { portfolioIds: previous.map((assignment) => assignment.portfolioId) },
          newValues: { portfolioIds: uniqueIds },
        },
      });
    }

    return { portfolioIds: uniqueIds };
  }
}
