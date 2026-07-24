import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt()
  @Min(0)
  @Max(30)
  graceDays: number;
}
