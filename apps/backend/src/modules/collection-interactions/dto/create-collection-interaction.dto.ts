import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  CollectionChannelEnum,
  CollectionResultEnum,
  type CollectionChannel,
  type CollectionResult,
} from '@inversiones/shared';

export class CreateCollectionInteractionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  clientId?: number;

  @IsOptional()
  @IsString()
  loanId?: string;

  @IsEnum(CollectionChannelEnum)
  channel!: CollectionChannel;

  @IsEnum(CollectionResultEnum)
  result!: CollectionResult;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  notes!: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  nextFollowUpTime?: string;

  @ValidateIf((dto: CreateCollectionInteractionDto) => dto.result === 'PAYMENT_PROMISE')
  @IsDefined()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  promiseAmount?: number;

  @ValidateIf((dto: CreateCollectionInteractionDto) => dto.result === 'PAYMENT_PROMISE')
  @IsDefined()
  @IsDateString()
  promiseDate?: string;
}
