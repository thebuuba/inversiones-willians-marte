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
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import {
  assertAllowedUploadedFile,
  type MemoryUploadedFile,
} from '../documents/document-upload-validation';
import { ClientPhotoCaptureSessionsService } from './client-photo-capture-sessions.service';
import { CreateClientPhotoCaptureSessionDto } from './dto/create-client-photo-capture-session.dto';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

const MAX_CLIENT_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('clients/photo-capture-sessions')
export class ClientPhotoCaptureSessionsController {
  constructor(private captureSessions: ClientPhotoCaptureSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLECTOR')
  async create(@Body() dto: CreateClientPhotoCaptureSessionDto, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.captureSessions.create(dto.clientId, user.id, scope);
  }

  @Get(':token/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLECTOR')
  status(@Param('token') token: string, @CurrentUser('id') userId: string) {
    return this.captureSessions.getStatus(token, userId);
  }

  @Get(':token/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLECTOR')
  photo(@Param('token') token: string, @CurrentUser('id') userId: string) {
    return this.captureSessions.getPhoto(token, userId);
  }

  @Post(':token/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COLLECTOR')
  close(@Param('token') token: string, @CurrentUser('id') userId: string) {
    return this.captureSessions.close(token, userId);
  }

  @Get(':token')
  findOne(@Param('token') token: string) {
    return this.captureSessions.findPublic(token);
  }

  @Post(':token/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CLIENT_PHOTO_UPLOAD_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_PHOTO_MIME_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Solo se permiten fotografías JPG, PNG o WebP.'), false);
      },
    }),
  )
  upload(@Param('token') token: string, @UploadedFile() file: MemoryUploadedFile) {
    if (!file) throw new BadRequestException('File is required');
    assertAllowedUploadedFile(file);
    return this.captureSessions.upload(token, {
      contents: file.buffer,
      mimeType: file.mimetype,
    });
  }
}
