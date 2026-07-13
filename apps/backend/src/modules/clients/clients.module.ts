import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuditModule } from '../audit/audit.module';
import { ClientPhotoCaptureSessionsController } from './client-photo-capture-sessions.controller';
import { ClientPhotoCaptureSessionsService } from './client-photo-capture-sessions.service';

@Module({
  imports: [AuditModule],
  controllers: [ClientsController, ClientPhotoCaptureSessionsController],
  providers: [ClientsService, ClientPhotoCaptureSessionsService],
  exports: [ClientsService],
})
export class ClientsModule {}
