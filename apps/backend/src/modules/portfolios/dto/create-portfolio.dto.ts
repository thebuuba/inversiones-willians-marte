import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
