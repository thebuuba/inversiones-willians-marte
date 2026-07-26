import { IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { UserRoleEnum } from '@inversiones/shared';
import type { UserRole } from '@inversiones/shared';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números, punto, guion y guion bajo',
  })
  username: string;

  @IsString()
  @MinLength(10)
  password: string;

  @IsEnum(UserRoleEnum)
  role: UserRole;
}
