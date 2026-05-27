import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';

export class CreateInvestorDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  @Min(0)
  capital: number;

  @IsNumber()
  @Min(0)
  monthlyPayment: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
