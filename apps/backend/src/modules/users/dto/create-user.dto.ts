import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRoleEnum } from '@inversiones/shared';
import type { UserRole } from '@inversiones/shared';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRoleEnum)
  role: UserRole;
}
