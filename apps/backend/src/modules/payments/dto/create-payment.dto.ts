import {
  IsInt,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  loanId: string;

  @IsInt()
  clientId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

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
