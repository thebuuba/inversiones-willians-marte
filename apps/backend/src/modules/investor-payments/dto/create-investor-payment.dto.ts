import { IsString, IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateInvestorPaymentDto {
  @IsString()
  investorId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  periodYear: number;

  @IsString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
