import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, type TaskStatus } from '@inversiones/database';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { normalizePagination } from '../../common/pagination';

@Injectable()
export class TasksService {
  async create(dto: CreateTaskDto, userId: string) {
    const assignedToId = dto.assignedToId ?? userId;
    await this.ensureActiveAssignee(assignedToId);
    return prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        time: dto.time,
        priority: dto.priority ?? 'MEDIUM',
        category: dto.category ?? 'oficina',
        createdById: userId,
        assignedToId,
      },
      include: this.taskPeople,
    });
  }

  async count(userId: string, status?: TaskStatus): Promise<number> {
    return prisma.task.count({ where: { assignedToId: userId, ...(status ? { status } : {}) } });
  }

  async findAll(userId: string, take = 100, skip = 0) {
    const pagination = normalizePagination(take, skip, 100);
    return prisma.task.findMany({
      where: { OR: [{ assignedToId: userId }, { createdById: userId }] },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: pagination.take,
      skip: pagination.skip,
      include: this.taskPeople,
    });
  }

  async findOne(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId?: string) {
    const task = await this.findOne(id);
    if (userId && task.assignedToId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('You cannot update this task');
    }
    if (dto.assignedToId) await this.ensureActiveAssignee(dto.assignedToId);
    return prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: this.taskPeople,
    });
  }

  private readonly taskPeople = {
    createdBy: { select: { id: true, name: true } },
    assignedTo: { select: { id: true, name: true } },
  } as const;

  private async ensureActiveAssignee(userId: string) {
    const assignee = await prisma.user.findUnique({
      where: { id: userId },
      select: { active: true },
    });
    if (!assignee) throw new NotFoundException('Assigned user not found');
    if (!assignee.active) throw new BadRequestException('Assigned user is inactive');
  }

  async remove(id: string, userId?: string) {
    const task = await this.findOne(id);
    const deleted = await prisma.task.delete({ where: { id } });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TASK_DELETED',
          entityType: 'Task',
          entityId: id,
          oldValues: { title: task.title },
        },
      });
    }

    return deleted;
  }
}
