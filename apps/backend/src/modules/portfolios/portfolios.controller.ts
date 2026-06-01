import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@Controller('portfolios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortfoliosController {
  constructor(private portfolios: PortfoliosService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR')
  create(@Body() dto: CreatePortfolioDto, @CurrentUser('id') userId: string) {
    return this.portfolios.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR', 'VIEWER')
  findAll() {
    return this.portfolios.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'COLLECTOR', 'VIEWER')
  findOne(@Param('id') id: string) {
    return this.portfolios.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.portfolios.remove(id);
  }
}
