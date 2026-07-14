import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentProcessingService } from './document-processing.service';
import { DocumentCaptureSessionsController } from './document-capture-sessions.controller';
import { DocumentCaptureSessionsService } from './document-capture-sessions.service';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [DocumentsController, DocumentCaptureSessionsController],
  providers: [DocumentsService, DocumentProcessingService, DocumentCaptureSessionsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
