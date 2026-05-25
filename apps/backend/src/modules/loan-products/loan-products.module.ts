import { Module } from '@nestjs/common';
import { LoanProductsController } from './loan-products.controller';
import { LoanProductsService } from './loan-products.service';

@Module({
  controllers: [LoanProductsController],
  providers: [LoanProductsService],
  exports: [LoanProductsService],
})
export class LoanProductsModule {}
