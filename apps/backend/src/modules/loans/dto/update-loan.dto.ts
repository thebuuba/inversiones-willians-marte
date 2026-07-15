import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LoanStatusEnum } from '@inversiones/shared';
import type { LoanStatus } from '@inversiones/shared';

export class UpdateLoanDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LoanStatusEnum)
  status?: LoanStatus;

  @IsOptional()
  @IsString()
  portfolioId?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  interestRate?: number;
}
