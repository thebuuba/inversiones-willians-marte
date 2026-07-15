import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@inversiones/database';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto, actorUserId?: string) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username?.trim().toLowerCase();
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });
    if (exists) throw new ConflictException('Email or username already registered');

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
}
