import { Type } from 'class-transformer';
import { IsInt, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  clientId?: number;

  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsString()
  loanId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
