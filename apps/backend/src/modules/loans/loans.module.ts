import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { AmortizationService } from './amortization.service';
import { LoanPayoffService } from './loan-payoff.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, AmortizationService, LoanPayoffService],
  exports: [LoansService, AmortizationService, LoanPayoffService],
})
export class LoansModule {}
