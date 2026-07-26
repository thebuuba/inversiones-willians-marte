import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { TaskPriorityEnum } from '@inversiones/shared';
import type { TaskPriority } from '@inversiones/shared';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
