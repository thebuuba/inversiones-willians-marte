import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddCapitalDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  movementDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
