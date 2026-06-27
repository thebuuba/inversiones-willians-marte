import { IsString } from 'class-validator';

export class PayoffQuoteDto {
  @IsString()
  payoffDate: string;
}
