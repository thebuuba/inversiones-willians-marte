import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Matches(/\S/, { message: 'El nombre del documento no puede estar vacío' })
  name: string;
}
