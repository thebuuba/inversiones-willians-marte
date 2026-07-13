import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddLoanCapitalDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
