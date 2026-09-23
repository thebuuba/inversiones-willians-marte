import { IsInt, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRequestDto {
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  identification?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  reference?: string | null;

  @IsOptional()
  @IsInt()
  clientId?: number;
}
