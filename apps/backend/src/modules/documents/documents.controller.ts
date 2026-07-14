import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
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
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { DOCUMENT_UPLOAD_LIMITS } from './document-upload-options';
import { assertAllowedUploadedFile, type MemoryUploadedFile } from './document-upload-validation';
import { normalizePagination } from '../../common/pagination';
import { createDocumentStorageKey } from './document-storage-key';

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
    @UploadedFile() file: MemoryUploadedFile,
    @Body() dto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    assertAllowedUploadedFile(file);
    const storageKey = createDocumentStorageKey(file.originalname);
    return this.documents.create(
      {
        name: dto.name || file.originalname,
        category: dto.category || 'general',
        clientId: dto.clientId,
        investorId: dto.investorId,
        loanId: dto.loanId,
        notes: dto.notes,
        fileUrl: storageKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedFile: {
          filename: storageKey,
          originalname: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer,
        },
      },
      userId,
    );
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  findAll(
    @Query('clientId') clientId?: string,
    @Query('investorId') investorId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const pagination = normalizePagination(Number(take ?? 100), Number(skip ?? 0), 100);
    return this.documents.findAll(
      clientId ? Number(clientId) : undefined,
      investorId,
      pagination.take,
      pagination.skip,
    );
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
    res.setHeader(
      'Content-Disposition',
      `${disposition === 'inline' ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.filename)}"`,
    );
    if (disposition === 'inline') {
      return res.send(file.contents);
    }
    return res.send(file.contents);
  }

  @Patch(':id')
  @Roles('ADMIN', 'COLLECTOR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documents.updateName(id, dto.name, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documents.remove(id, userId);
  }
}
