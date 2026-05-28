import { Controller, Post, Get, Param, Query, UseGuards, Body } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private loans: LoansService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateLoanDto, @CurrentUser('id') userId: string) {
    return this.loans.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR')
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.loans.findAll(status, search);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR')
  findOne(@Param('id') id: string) {
    return this.loans.findOne(id);
  }

  @Get(':id/summary')
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR')
  getSummary(@Param('id') id: string) {
    return this.loans.getSummary(id);
  }
}
