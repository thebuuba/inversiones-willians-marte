import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddCapitalDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsDateString()
  movementDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
