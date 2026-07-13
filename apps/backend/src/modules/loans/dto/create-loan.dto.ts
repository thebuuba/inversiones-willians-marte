import {
  IsDateString,
  IsInt,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { InterestTypeEnum, PaymentFrequencyEnum } from '@inversiones/shared';
import type { InterestType, PaymentFrequency } from '@inversiones/shared';

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
}

export interface AmortizationRow {
  installment: number;
  dueDate: Date;
  amount: number;
  principalPart: number;
  interestPart: number;
  balanceAfter: number;
}
