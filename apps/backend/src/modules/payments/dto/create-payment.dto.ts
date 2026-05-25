import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  loanId: string;

  @IsString()
  clientId: string;

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
