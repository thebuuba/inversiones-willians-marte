import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { InvestorPaymentsService } from './investor-payments.service';
import { CreateInvestorPaymentDto } from './dto/create-investor-payment.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@Controller('investor-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorPaymentsController {
  constructor(private service: InvestorPaymentsService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  create(@Body() dto: CreateInvestorPaymentDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get(':investorId')
  @Roles('ADMIN', 'COLLECTOR')
  findByInvestor(@Param('investorId') investorId: string) {
    return this.service.findByInvestor(investorId);
  }

  @Get('check')
  @Roles('ADMIN', 'COLLECTOR')
  checkPeriod(
    @Query('investorId') investorId: string,
    @Query('periodMonth') periodMonth: string,
    @Query('periodYear') periodYear: string,
  ) {
    return this.service.checkPeriod(investorId, Number(periodMonth), Number(periodYear));
  }
}
