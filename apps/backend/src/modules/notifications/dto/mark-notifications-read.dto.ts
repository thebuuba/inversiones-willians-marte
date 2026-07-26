import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class MarkNotificationsReadDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  keys!: string[];
}
