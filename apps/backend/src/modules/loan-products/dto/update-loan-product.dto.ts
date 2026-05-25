import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanProductDto } from './create-loan-product.dto';

export class UpdateLoanProductDto extends PartialType(CreateLoanProductDto) {}
