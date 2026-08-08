import { ArrayMaxSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserPortfoliosDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  portfolioIds: string[];
}
