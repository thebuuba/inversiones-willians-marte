import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'COLLECTOR')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.notifications.findAll(userId);
  }

  @Post('read')
  markRead(@CurrentUser('id') userId: string, @Body() dto: MarkNotificationsReadDto) {
    return this.notifications.markRead(userId, dto.keys);
  }
}
