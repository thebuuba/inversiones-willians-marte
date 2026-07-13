import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCashMovementDto {
  @IsIn(['IN', 'OUT'])
  type!: 'IN' | 'OUT';

  @IsString()
  @MaxLength(160)
  person!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsISO8601()
  movementDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
