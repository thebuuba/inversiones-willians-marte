import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('overview')
  @Roles('ADMIN', 'COLLECTOR')
  async overview(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.overview(scope);
  }

  @Get('dashboard')
  @Roles('ADMIN', 'COLLECTOR')
  async dashboard(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.dashboard(scope);
  }

  @Get('collections/priorities')
  @Roles('ADMIN', 'COLLECTOR')
  async collectionPriorities(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.collectionPriorities(scope);
  }

  @Get('portfolio')
  @Roles('ADMIN', 'COLLECTOR')
  async portfolio(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.portfolioByStatus(scope);
  }

  @Get('collectors')
  @Roles('ADMIN', 'COLLECTOR')
  async collectors(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.collectorPerformance(scope);
  }

  @Get('collections/monthly')
  @Roles('ADMIN', 'COLLECTOR')
  async monthlyCollections(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.monthlyCollections(scope);
  }

  @Get('movement/weekly')
  @Roles('ADMIN', 'COLLECTOR')
  async weeklyMovement(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.weeklyMovement(scope);
  }

  @Get('payments/upcoming')
  @Roles('ADMIN', 'COLLECTOR')
  async upcomingPayments(@CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.reports.upcomingPayments(scope);
  }
}
