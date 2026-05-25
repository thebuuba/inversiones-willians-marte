import { Controller, Post, Get, Param, Query, UseGuards, Body } from '@nestjs/common';
import { LoansService } from './services/loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private loans: LoansService) {}

  @Post()
  create(@Body() dto: CreateLoanDto, @CurrentUser('id') userId: string) {
    return this.loans.create(dto, userId);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.loans.findAll(status, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loans.findOne(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.loans.getSummary(id);
  }
}
