import { IsInt, IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { InterestTypeEnum } from '@inversiones/shared';
import type { InterestType } from '@inversiones/shared';

export class CreateLoanDto {
  @IsInt()
  clientId: number;

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

  @IsOptional()
  @IsString()
  portfolioId?: string;

  @IsOptional()
  @IsEnum(InterestTypeEnum)
  amortizationType?: InterestType;
}

export interface AmortizationRow {
  installment: number;
  dueDate: Date;
  amount: number;
  principalPart: number;
  interestPart: number;
  balanceAfter: number;
}
