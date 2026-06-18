import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Post()
  @Roles('ADMIN', 'COLLECTOR')
  create(@Body() dto: CreateClientDto, @CurrentUser('id') userId: string) {
    return this.clients.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  findAll(
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.clients.findAll(
      search,
      take ? parseInt(take, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Get('basic/:id')
  @Roles('ADMIN', 'COLLECTOR')
  findBasic(@Param('id', ParseIntPipe) id: number) {
    return this.clients.findBasic(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clients.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'COLLECTOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.clients.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: string) {
    return this.clients.remove(id, userId);
  }
}
