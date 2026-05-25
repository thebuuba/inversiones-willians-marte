import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @CurrentUser('id') userId: string) {
    return this.payments.create(dto, userId);
  }

  @Get('loan/:loanId')
  findByLoan(@Param('loanId') loanId: string) {
    return this.payments.findByLoan(loanId);
  }
}
