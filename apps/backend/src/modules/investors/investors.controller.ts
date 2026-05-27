import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { InvestorsService } from './investors.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('investors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorsController {
  constructor(private investors: InvestorsService) {}

  @Post()
  create(@Body() dto: CreateInvestorDto, @CurrentUser('id') userId: string) {
    return this.investors.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.investors.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investors.findOne(id);
  }
}
