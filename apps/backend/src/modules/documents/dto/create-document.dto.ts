import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsString()
  loanId?: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
