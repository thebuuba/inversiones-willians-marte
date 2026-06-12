import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvestmentDto {
  @IsNumber()
  @Min(0)
  capital: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPayment?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
