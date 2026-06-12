import { Module } from '@nestjs/common';
import { InvestmentsModule } from '../investments/investments.module';
import { InvestorPaymentsController } from './investor-payments.controller';
import { InvestorPaymentsService } from './investor-payments.service';

@Module({
  imports: [InvestmentsModule],
  controllers: [InvestorPaymentsController],
  providers: [InvestorPaymentsService],
})
export class InvestorPaymentsModule {}
