import { Controller, Post, Get, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { normalizePagination } from '../../common/pagination';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

@Controller('portfolios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortfoliosController {
  constructor(private portfolios: PortfoliosService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  create(@Body() dto: CreatePortfolioDto, @CurrentUser('id') userId: string) {
    return this.portfolios.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    const pagination = normalizePagination(Number(take ?? 100), Number(skip ?? 0), 100);
    return this.portfolios.findAll(scope, pagination.take, pagination.skip);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  async findOne(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.portfolios.findOne(scope, id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.portfolios.remove(scope, id, user.id);
  }
}
