import { Controller, Get } from '@nestjs/common';
import { prisma } from '@inversiones/database';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth() {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'backend',
      database: 'ok',
    };
  }
}
