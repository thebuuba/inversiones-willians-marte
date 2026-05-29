import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatusEnum } from '@inversiones/shared';
import type { TaskStatus } from '@inversiones/shared';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
