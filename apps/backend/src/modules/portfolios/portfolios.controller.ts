import { Controller, Post, Get, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { normalizePagination } from '../../common/pagination';

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
  findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    const pagination = normalizePagination(Number(take ?? 100), Number(skip ?? 0), 100);
    return this.portfolios.findAll(pagination.take, pagination.skip);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  findOne(@Param('id') id: string) {
    return this.portfolios.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.portfolios.remove(id, userId);
  }
}
