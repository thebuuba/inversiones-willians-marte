import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@Controller('cash')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashController {
  constructor(private readonly cash: CashService) {}

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  findDay(@Query('date') date: string) {
    return this.cash.findDay(date);
  }

  @Post('movements')
  @Roles('ADMIN', 'COLLECTOR')
  createManual(@Body() dto: CreateCashMovementDto, @CurrentUser('id') userId: string) {
    return this.cash.createManual(dto, userId);
  }
}
