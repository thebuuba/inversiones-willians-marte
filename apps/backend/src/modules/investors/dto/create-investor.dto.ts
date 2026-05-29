import { IsString, IsNumber, IsOptional, Min, MinLength, IsDateString, IsEnum } from 'class-validator';

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

  @IsOptional()
  @IsString()
  phone2?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  photo?: string;

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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
