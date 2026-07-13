import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvestmentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  capital: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  rate: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
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
