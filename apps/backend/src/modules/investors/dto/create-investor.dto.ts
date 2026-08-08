import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';

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
  @MaxLength(1_500_000)
  @Matches(/^(?:|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+)$/, {
    message: 'La fotografía debe ser una imagen JPG, PNG o WebP válida',
  })
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
