import {
  IsDateString,
  IsInt,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsIn,
  IsArray,
  ArrayUnique,
  Max,
  Min,
} from 'class-validator';
import { InterestTypeEnum, LoanOperationTypeEnum, PaymentFrequencyEnum } from '@inversiones/shared';
import type { InterestType, LoanOperationType, PaymentFrequency } from '@inversiones/shared';

export class CreateLoanDto {
  @IsInt()
  clientId: number;

  @IsString()
  productId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  principal: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  interestRate?: number;

  @IsInt()
  @Min(1)
  @Max(600)
  term: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  portfolioId?: string;

  @IsOptional()
  @IsEnum(InterestTypeEnum)
  amortizationType?: InterestType;

  @IsOptional()
  @IsEnum(PaymentFrequencyEnum)
  paymentFrequency?: PaymentFrequency;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  customPayment?: number;

  @IsOptional()
  @IsEnum(LoanOperationTypeEnum)
  operationType?: LoanOperationType;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  sourceLoanIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  paidInstallments?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidLateFee?: number;

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

export interface AmortizationRow {
  installment: number;
  dueDate: Date;
  amount: number;
  principalPart: number;
  interestPart: number;
  balanceAfter: number;
}
