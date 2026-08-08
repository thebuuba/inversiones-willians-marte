import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Body,
  Delete,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { AddLoanCapitalDto } from './dto/add-loan-capital.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

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
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('sort') sort?: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.findAll(
      scope,
      status,
      search,
      take ? parseInt(take, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
      sort,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  async findOne(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.findOne(scope, id);
  }

  @Post(':id/capital-additions')
  @Roles('ADMIN', 'COLLECTOR')
  async addCapital(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Body() dto: AddLoanCapitalDto,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.addCapital(scope, id, dto, user.id);
  }

  @Get(':id/payoff-quote')
  @Roles('ADMIN', 'COLLECTOR')
  async getPayoffQuote(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Query('payoffDate') payoffDate: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.getPayoffQuote(scope, id, payoffDate);
  }

  @Get(':id/receipt')
  @Roles('ADMIN', 'COLLECTOR')
  async getReceipt(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.getReceipt(scope, id);
  }

  @Post(':id/receipt')
  @Roles('ADMIN', 'COLLECTOR')
  async ensureReceipt(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.ensureReceipt(scope, id, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'COLLECTOR')
  async update(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Body() dto: UpdateLoanDto,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.update(scope, id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN', 'COLLECTOR')
  async remove(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    await this.loans.remove(scope, id);
  }

  @Get(':id/summary')
  @Roles('ADMIN', 'COLLECTOR')
  async getSummary(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.loans.getSummary(scope, id);
  }
}
