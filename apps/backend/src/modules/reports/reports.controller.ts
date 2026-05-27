import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'MANAGER')
  dashboard() {
    return this.reports.dashboard();
  }

  @Get('portfolio')
  @Roles('ADMIN', 'MANAGER')
  portfolio() {
    return this.reports.portfolioByStatus();
  }

  @Get('collectors')
  @Roles('ADMIN', 'MANAGER')
  collectors() {
    return this.reports.collectorPerformance();
  }

  @Get('collections/monthly')
  @Roles('ADMIN', 'MANAGER')
  monthlyCollections() {
    return this.reports.monthlyCollections();
  }

  @Get('movement/weekly')
  @Roles('ADMIN', 'MANAGER')
  weeklyMovement() {
    return this.reports.weeklyMovement();
  }

  @Get('payments/upcoming')
  @Roles('ADMIN', 'MANAGER')
  upcomingPayments() {
    return this.reports.upcomingPayments();
  }
}
