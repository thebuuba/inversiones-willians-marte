import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';
import {
  assertAllowedUploadedFile,
  type MemoryUploadedFile,
} from '../documents/document-upload-validation';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private requests: RequestsService) {}

  @Post()
  async create(@Body() dto: CreateRequestDto, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.create(scope, dto, user.id);
  }

  @Get('count')
  async count(@CurrentUser() user: ScopeUser, @Query('status') status?: string) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.count(scope, status);
  }

  @Get()
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.findAll(scope, Number(take ?? 100), Number(skip ?? 0));
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ScopeUser, @Param('id') id: string) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.findOne(scope, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.update(scope, id, dto, user.id);
  }

  @Post(':id/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
    }),
  )
  async addPhoto(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @UploadedFile() file?: MemoryUploadedFile,
  ) {
    if (!file) throw new BadRequestException('Seleccione una imagen JPEG, PNG o WebP');
    assertAllowedUploadedFile(file);
    const scope = await resolvePortfolioScope(user);
    return this.requests.addPhoto(scope, id, file);
  }

  @Get(':id/photos/:photoId')
  async getPhoto(
    @CurrentUser() user: ScopeUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Res() res: Response,
  ) {
    const scope = await resolvePortfolioScope(user);
    const photo = await this.requests.getPhoto(scope, id, photoId);
    res.type(photo.mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(photo.contents);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'COLLECTOR')
  async approve(@Param('id') id: string, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.approve(scope, id, user.id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'COLLECTOR')
  async reject(@Param('id') id: string, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.requests.reject(scope, id, user.id);
  }
}
