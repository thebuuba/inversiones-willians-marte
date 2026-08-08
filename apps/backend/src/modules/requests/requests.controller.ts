import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private requests: RequestsService) {}

  @Post()
  async create(@Body() dto: CreateRequestDto, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.create(scope, dto, user.id);
  }

  @Get('count')
  async count(@CurrentUser() user: ScopeUser, @Query('status') status?: string) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.count(scope, status);
  }

  @Get()
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.findAll(scope, Number(take ?? 100), Number(skip ?? 0));
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.findOne(scope, id);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'COLLECTOR')
  async approve(@Param('id') id: string, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.approve(scope, id, user.id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'COLLECTOR')
  async reject(@Param('id') id: string, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.reject(scope, id, user.id);
  }
}
