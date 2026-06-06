import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { InterestTypeEnum, PaymentFrequencyEnum } from '@inversiones/shared';
import type { InterestType, PaymentFrequency } from '@inversiones/shared';

export class CreateLoanProductDto {
  @IsString()
  @Min(2)
  name: string;

  @IsEnum(InterestTypeEnum)
  interestType: InterestType;

  @IsNumber()
  @Min(0)
  interestRate: number;

  @IsOptional()
  @IsEnum(PaymentFrequencyEnum)
  interestFrequency?: PaymentFrequency;

  @IsEnum(PaymentFrequencyEnum)
  paymentFrequency: PaymentFrequency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTerm?: number;

  @IsOptional()
  @IsString()
  latePenaltyType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  latePenaltyValue?: number;
}
