import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  graceDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  companyTaxId?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  companyPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  companyAddress?: string;
}
