import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  async get() {
    return prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, graceDays: 5 },
    });
  }

  async update(dto: UpdateSettingsDto) {
    return prisma.systemSettings.upsert({
      where: { id: 1 },
      update: dto,
      create: { id: 1, ...dto },
    });
  }
}
