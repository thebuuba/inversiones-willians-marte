import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CreateDocumentCaptureSessionDto } from './dto/create-document-capture-session.dto';
import { DocumentCaptureSessionsService } from './document-capture-sessions.service';
import { CAPTURE_UPLOAD_LIMITS } from './document-upload-options';
import { assertAllowedUploadedFile, type MemoryUploadedFile } from './document-upload-validation';
import { createDocumentStorageKey } from './document-storage-key';

const ALLOWED_CAPTURE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Controller('documents/capture-sessions')
export class DocumentCaptureSessionsController {
  constructor(private captureSessions: DocumentCaptureSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLECTOR')
  create(@Body() dto: CreateDocumentCaptureSessionDto, @CurrentUser('id') userId: string) {
    return this.captureSessions.create(dto.clientId, userId);
  }

  @Get(':token')
  findOne(@Param('token') token: string) {
    return this.captureSessions.findActive(token);
  }

  @Post(':token/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLECTOR')
  close(@Param('token') token: string) {
    return this.captureSessions.close(token);
  }

  @Post(':token/upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'processedFile', maxCount: 1 },
      ],
      {
        limits: CAPTURE_UPLOAD_LIMITS,
        fileFilter: (_req, file, cb) => {
          const allowed =
            file.fieldname === 'processedFile'
              ? file.mimetype === 'image/webp'
              : ALLOWED_CAPTURE_MIME_TYPES.includes(file.mimetype);
          if (allowed) {
            cb(null, true);
          } else {
            cb(new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`), false);
          }
        },
      },
    ),
  )
  upload(
    @Param('token') token: string,
    @UploadedFiles()
    files: { file?: MemoryUploadedFile[]; processedFile?: MemoryUploadedFile[] },
  ) {
    const file = files?.file?.[0];
    const processedFile = files?.processedFile?.[0];
    if (!file) throw new BadRequestException('File is required');
    assertAllowedUploadedFile(file);
    if (processedFile) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Processed file requires an image original');
      }
      assertAllowedUploadedFile(processedFile);
    }
    const storageKey = createDocumentStorageKey(file.originalname, 'captures/documents');
    const processedStorageKey = processedFile
      ? createDocumentStorageKey(processedFile.originalname, 'captures/documents')
      : undefined;
    return this.captureSessions.upload(token, {
      name: file.originalname.replace(/\.[^/.]+$/, '') || file.originalname,
      fileUrl: storageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedFile: {
        filename: storageKey,
        originalname: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer,
        processedFile:
          processedFile && processedStorageKey
            ? {
                filename: processedStorageKey,
                mimetype: processedFile.mimetype,
                buffer: processedFile.buffer,
              }
            : undefined,
      },
    });
  }
}
