import { Module } from '@nestjs/common';
import { InvestorPaymentsController } from './investor-payments.controller';
import { InvestorPaymentsService } from './investor-payments.service';

@Module({
  controllers: [InvestorPaymentsController],
  providers: [InvestorPaymentsService],
})
export class InvestorPaymentsModule {}
