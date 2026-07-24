import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
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

  @IsOptional()
  @IsBoolean()
  lateFeeEnabled?: boolean;

  @IsOptional()
  @IsIn(['PER_INSTALLMENT', 'DAILY'])
  lateFeeMode?: 'PER_INSTALLMENT' | 'DAILY';

  @IsOptional()
  @IsIn(['PERCENTAGE', 'AMOUNT'])
  lateFeeCalculation?: 'PERCENTAGE' | 'AMOUNT';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  lateFeeValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  lateFeeGraceDays?: number;
}
