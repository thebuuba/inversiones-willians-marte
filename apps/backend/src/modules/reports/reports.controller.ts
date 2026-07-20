import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('overview')
  @Roles('ADMIN', 'COLLECTOR')
  overview() {
    return this.reports.overview();
  }

  @Get('dashboard')
  @Roles('ADMIN', 'COLLECTOR')
  dashboard() {
    return this.reports.dashboard();
  }

  @Get('collections/priorities')
  @Roles('ADMIN', 'COLLECTOR')
  collectionPriorities() {
    return this.reports.collectionPriorities();
  }

  @Get('portfolio')
  @Roles('ADMIN', 'COLLECTOR')
  portfolio() {
    return this.reports.portfolioByStatus();
  }

  @Get('collectors')
  @Roles('ADMIN', 'COLLECTOR')
  collectors() {
    return this.reports.collectorPerformance();
  }

  @Get('collections/monthly')
  @Roles('ADMIN', 'COLLECTOR')
  monthlyCollections() {
    return this.reports.monthlyCollections();
  }

  @Get('movement/weekly')
  @Roles('ADMIN', 'COLLECTOR')
  weeklyMovement() {
    return this.reports.weeklyMovement();
  }

  @Get('payments/upcoming')
  @Roles('ADMIN', 'COLLECTOR')
  upcomingPayments() {
    return this.reports.upcomingPayments();
  }
}
