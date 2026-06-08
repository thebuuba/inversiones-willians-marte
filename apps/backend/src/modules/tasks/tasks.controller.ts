import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskStatusEnum } from '@inversiones/shared';
import type { TaskStatus } from '@inversiones/shared';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser('id') userId: string) {
    return this.tasks.create(dto, userId);
  }

  @Get('count')
  count(@Query('status') status?: string) {
    const validStatuses = Object.values(TaskStatusEnum) as TaskStatus[];
    if (status && validStatuses.includes(status as TaskStatus)) {
      return this.tasks.count(status as TaskStatus);
    }
    return this.tasks.count();
  }

  @Get()
  findAll() {
    return this.tasks.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasks.remove(id);
  }
}
