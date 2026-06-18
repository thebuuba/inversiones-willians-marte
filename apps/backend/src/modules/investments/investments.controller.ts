import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { AddCapitalDto } from './dto/add-capital.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentsService } from './investments.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestmentsController {
  constructor(private investments: InvestmentsService) {}

  @Post('investors/:investorId/investments')
  @Roles('ADMIN')
  create(
    @Param('investorId') investorId: string,
    @Body() dto: CreateInvestmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.investments.create(investorId, dto, userId);
  }

  @Get('investors/:investorId/investments')
  @Roles('ADMIN', 'COLLECTOR')
  listByInvestor(@Param('investorId') investorId: string) {
    return this.investments.listByInvestor(investorId);
  }

  @Get('investments/:investmentId')
  @Roles('ADMIN', 'COLLECTOR')
  findOne(@Param('investmentId') investmentId: string) {
    return this.investments.findOne(investmentId);
  }

  @Post('investments/:investmentId/capital-additions')
  @Roles('ADMIN')
  addCapital(
    @Param('investmentId') investmentId: string,
    @Body() dto: AddCapitalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.investments.addCapital(investmentId, dto, userId);
  }
}
