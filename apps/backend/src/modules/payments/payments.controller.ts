import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR')
  create(@Body() dto: CreatePaymentDto, @CurrentUser('id') userId: string) {
    return this.payments.create(dto, userId);
  }

  @Get('loan/:loanId')
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR')
  findByLoan(@Param('loanId') loanId: string) {
    return this.payments.findByLoan(loanId);
  }
}
