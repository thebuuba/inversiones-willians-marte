import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { AmortizationService } from './amortization.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, AmortizationService],
  exports: [LoansService, AmortizationService],
})
export class LoansModule {}
