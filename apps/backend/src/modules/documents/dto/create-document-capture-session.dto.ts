import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateDocumentCaptureSessionDto {
  @IsInt()
  @Type(() => Number)
  clientId!: number;
}
