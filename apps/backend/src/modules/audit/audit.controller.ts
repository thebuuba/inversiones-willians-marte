import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

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
  findClientHistory(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.audit.findClientHistory(clientId);
  }
}
