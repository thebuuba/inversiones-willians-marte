import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CreateDocumentCaptureSessionDto } from './dto/create-document-capture-session.dto';
import { DocumentCaptureSessionsService } from './document-capture-sessions.service';

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

  @Post(':token/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'uploads'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_CAPTURE_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`), false);
        }
      },
    }),
  )
  upload(@Param('token') token: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return this.captureSessions.upload(token, {
      name: file.originalname.replace(/\.[^/.]+$/, '') || file.originalname,
      fileUrl: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedFile: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
    });
  }
}
