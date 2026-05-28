import { IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
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
  @MinLength(6)
  password: string;
}
