import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  async create(dto: CreateTaskDto, userId: string) {
    return prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: dto.priority ?? 'MEDIUM',
        createdById: userId,
      },
    });
  }

  async findAll() {
    return prisma.task.findMany({
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
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

  async remove(id: string) {
    await this.findOne(id);
    return prisma.task.delete({ where: { id } });
  }
}
