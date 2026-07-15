import { Controller, Post, Get, Param, Query, UseGuards, Body } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { AddLoanCapitalDto } from './dto/add-loan-capital.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private loans: LoansService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  create(@Body() dto: CreateLoanDto, @CurrentUser('id') userId: string) {
    return this.loans.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('sort') sort?: string,
  ) {
    return this.loans.findAll(
      status,
      search,
      take ? parseInt(take, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
      sort,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  findOne(@Param('id') id: string) {
    return this.loans.findOne(id);
  }

  @Post(':id/capital-additions')
  @Roles('ADMIN', 'COLLECTOR')
  addCapital(
    @Param('id') id: string,
    @Body() dto: AddLoanCapitalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.loans.addCapital(id, dto, userId);
  }

  @Get(':id/payoff-quote')
  @Roles('ADMIN', 'COLLECTOR')
  getPayoffQuote(@Param('id') id: string, @Query('payoffDate') payoffDate: string) {
    return this.loans.getPayoffQuote(id, payoffDate);
  }

  @Get(':id/summary')
  @Roles('ADMIN', 'COLLECTOR')
  getSummary(@Param('id') id: string) {
    return this.loans.getSummary(id);
  }
}
