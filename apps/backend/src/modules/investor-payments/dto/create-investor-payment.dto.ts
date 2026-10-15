import {
  IsDateString,
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateInvestorPaymentDto {
  @IsOptional()
  @IsUUID()
  requestId?: string;
  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsString()
  investmentId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
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

  @IsDateString()
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
