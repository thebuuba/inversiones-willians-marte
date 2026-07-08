import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@inversiones/database';

@Injectable()
export class KeepaliveService {
  private readonly logger = new Logger(KeepaliveService.name);

  @Cron(CronExpression.EVERY_3_HOURS)
  async keepDatabaseAlive() {
    this.logger.log('Running database keepalive ping...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      this.logger.log('Database keepalive ping successful');
    } catch (error) {
      this.logger.error('Database keepalive ping failed', error);
    }
  }
}
