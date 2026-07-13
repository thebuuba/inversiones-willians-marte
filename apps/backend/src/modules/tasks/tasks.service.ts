import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, type TaskStatus } from '@inversiones/database';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { normalizePagination } from '../../common/pagination';

@Injectable()
export class TasksService {
  async create(dto: CreateTaskDto, userId: string) {
    return prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        time: dto.time,
        priority: dto.priority ?? 'MEDIUM',
        category: dto.category ?? 'oficina',
        createdById: userId,
      },
    });
  }

  async count(status?: TaskStatus): Promise<number> {
    const args = status ? { where: { status } } : undefined;
    return prisma.task.count(args);
  }

  async findAll(take = 100, skip = 0) {
    const pagination = normalizePagination(take, skip, 100);
    return prisma.task.findMany({
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: pagination.take,
      skip: pagination.skip,
    });
  }

  async findOne(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    return prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
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
