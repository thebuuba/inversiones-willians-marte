import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.payments.create(scope, dto, user.id);
  }

  @Get('loan/:loanId')
  @Roles('ADMIN', 'COLLECTOR')
  async findByLoan(@CurrentUser() user: ScopeUser, @Param('loanId') loanId: string) {
    const scope = await resolvePortfolioScope(user);
    return this.payments.findByLoan(scope, loanId);
  }
}
