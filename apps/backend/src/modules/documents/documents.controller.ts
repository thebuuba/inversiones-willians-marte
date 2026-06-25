import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { DOCUMENT_UPLOAD_LIMITS } from './document-upload-options';
import { assertAllowedUploadedFile } from './document-upload-validation';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/rtf',
];

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'uploads'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: DOCUMENT_UPLOAD_LIMITS,
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`), false);
        }
      },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    assertAllowedUploadedFile(file);
    return this.documents.create(
      {
        name: dto.name || file.originalname,
        category: dto.category || 'general',
        clientId: dto.clientId,
        investorId: dto.investorId,
        loanId: dto.loanId,
        notes: dto.notes,
        fileUrl: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedFile: {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
      },
      userId,
    );
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  findAll(@Query('clientId') clientId?: string, @Query('investorId') investorId?: string) {
    return this.documents.findAll(clientId ? Number(clientId) : undefined, investorId);
  }

  @Get(':id/file')
  @Roles('ADMIN', 'COLLECTOR')
  async download(
    @Param('id') id: string,
    @Query('disposition') disposition: string | undefined,
    @Query('variant') variant: string | undefined,
    @Res() res: Response,
  ) {
    const file = await this.documents.getFileForDownload(id, variant === 'processed');
    res.type(file.mimeType);
    if (disposition === 'inline') {
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(file.filename)}"`,
      );
      return res.sendFile(file.path);
    }
    return res.download(file.path, file.filename);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documents.remove(id, userId);
  }
}
