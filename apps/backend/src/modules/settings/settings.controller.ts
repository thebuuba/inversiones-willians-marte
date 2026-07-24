import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  get() {
    return this.settings.get();
  }

  @Patch()
  @Roles('ADMIN')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto.graceDays);
  }
}
