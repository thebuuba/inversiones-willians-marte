import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import {
  InterestType,
  InterestTypeEnum,
  PaymentFrequency,
  PaymentFrequencyEnum,
} from '@inversiones/shared';

export class CreateLoanDto {
  @IsString()
  clientId: string;

  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  principal: number;

  @IsNumber()
  @Min(1)
  term: number;

  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface AmortizationRow {
  installment: number;
  dueDate: Date;
  amount: number;
  principalPart: number;
  interestPart: number;
  balanceAfter: number;
}
