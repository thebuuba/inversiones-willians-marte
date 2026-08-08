import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @Roles('ADMIN')
  findAll(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.audit.findAll(entityType, entityId);
  }

  @Get('client/:clientId/history')
  @Roles('ADMIN', 'COLLECTOR')
  async findClientHistory(
    @CurrentUser() user: ScopeUser,
    @Param('clientId', ParseIntPipe) clientId: number,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.audit.findClientHistory(scope, clientId);
  }
}
