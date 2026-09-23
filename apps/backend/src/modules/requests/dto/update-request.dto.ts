import { OmitType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';

export class UpdateRequestDto extends OmitType(CreateRequestDto, ['clientId'] as const) {}
