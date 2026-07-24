import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';

@Injectable()
export class SettingsService {
  async get() {
    return prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, graceDays: 5 },
    });
  }

  async update(graceDays: number) {
    return prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { graceDays },
      create: { id: 1, graceDays },
    });
  }
}
