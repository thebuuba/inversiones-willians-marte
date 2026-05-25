import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './services/loans.service';
import { AmortizationService } from './services/amortization.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, AmortizationService],
  exports: [LoansService, AmortizationService],
})
export class LoansModule {}
