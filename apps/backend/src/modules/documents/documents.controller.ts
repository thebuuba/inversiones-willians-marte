import { Controller, Post, Get, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto, @CurrentUser('id') userId: string) {
    return this.documents.create(dto, userId);
  }

  @Get()
  findAll(@Query('clientId') clientId?: string, @Query('investorId') investorId?: string) {
    return this.documents.findAll(clientId, investorId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documents.remove(id);
  }
}
