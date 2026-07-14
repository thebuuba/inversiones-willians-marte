import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from '../health.controller';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AuthModule],
  controllers: [HealthController],
})
export class CloudflareProbeModule {}
