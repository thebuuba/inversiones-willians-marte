import {
  IsDate,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsInt,
  IsNumber,
  IsArray,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  altPhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  identification?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() incomeType?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() workplace?: string;
  @IsOptional() @IsNumber() @Min(0) monthlyIncome?: number | null;
  @IsOptional() @IsString() workTenure?: string;
  @IsOptional() @IsString() guarantorName?: string;
  @IsOptional() @IsString() guarantorRelation?: string;
  @IsOptional() @IsString() guarantorPhone?: string;
  @IsOptional() @IsString() guarantorIdentification?: string;
  @IsOptional() @IsString() referenceName?: string;
  @IsOptional() @IsString() referencePhone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dependents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1_500_000)
  @Matches(/^(?:|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+)$/, {
    message: 'La fotografía debe ser una imagen JPG, PNG o WebP válida',
  })
  photo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
