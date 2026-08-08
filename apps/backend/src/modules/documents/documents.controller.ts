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
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';
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
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'processedFile', maxCount: 1 },
      ],
      {
        limits: DOCUMENT_UPLOAD_LIMITS,
        fileFilter: (_req, file, cb) => {
          const allowed =
            file.fieldname === 'processedFile'
              ? file.mimetype === 'image/webp'
              : ALLOWED_MIME_TYPES.includes(file.mimetype);
          if (allowed) {
            cb(null, true);
          } else {
            cb(new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`), false);
          }
        },
      },
    ),
  )
  async create(
    @UploadedFiles()
    files: { file?: MemoryUploadedFile[]; processedFile?: MemoryUploadedFile[] },
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: ScopeUser,
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
    const storageKey = createDocumentStorageKey(file.originalname);
    const processedStorageKey = processedFile
      ? createDocumentStorageKey(processedFile.originalname)
      : undefined;
    const scope = await resolvePortfolioScope(user);
    return this.documents.create(
      scope,
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
          processedFile:
            processedFile && processedStorageKey
              ? {
                  filename: processedStorageKey,
                  mimetype: processedFile.mimetype,
                  buffer: processedFile.buffer,
                }
              : undefined,
        },
      },
      user.id,
    );
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query('clientId') clientId?: string,
    @Query('investorId') investorId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    const pagination = normalizePagination(Number(take ?? 100), Number(skip ?? 0), 100);
    return this.documents.findAll(
      scope,
      clientId ? Number(clientId) : undefined,
      investorId,
      pagination.take,
      pagination.skip,
    );
  }

  @Get(':id/file')
  @Roles('ADMIN', 'COLLECTOR')
  async download(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Query('disposition') disposition: string | undefined,
    @Query('variant') variant: string | undefined,
    @Res() res: Response,
  ) {
    const scope = await resolvePortfolioScope(user);
    const file = await this.documents.getFileForDownload(scope, id, variant === 'processed');
    const isInlineSafeType =
      file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf';
    const inline = disposition === 'inline' && isInlineSafeType;
    res.type(file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.filename)}"`,
    );
    return res.send(file.contents);
  }

  @Patch(':id')
  @Roles('ADMIN', 'COLLECTOR')
  async update(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.documents.updateName(scope, id, dto.name, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.documents.remove(scope, id, user.id);
  }
}
