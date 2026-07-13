import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private requests: RequestsService) {}

  @Post()
  create(@Body() dto: CreateRequestDto, @CurrentUser('id') userId: string) {
    return this.requests.create(dto, userId);
  }

  @Get('count')
  count(@Query('status') status?: string) {
    return this.requests.count(status);
  }

  @Get()
  findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.requests.findAll(Number(take ?? 100), Number(skip ?? 0));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requests.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'COLLECTOR')
  approve(@Param('id') id: string) {
    return this.requests.approve(id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'COLLECTOR')
  reject(@Param('id') id: string) {
    return this.requests.reject(id);
  }
}
