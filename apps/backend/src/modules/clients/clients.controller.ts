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
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

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
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.clients.findAll(
      scope,
      search,
      take ? parseInt(take, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Get('basic/:id')
  @Roles('ADMIN', 'COLLECTOR')
  async findBasic(@CurrentUser() user: ScopeUser, @Param('id', ParseIntPipe) id: number) {
    const scope = await resolvePortfolioScope(user);
    return this.clients.findBasic(scope, id);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  async findOne(@CurrentUser() user: ScopeUser, @Param('id', ParseIntPipe) id: number) {
    const scope = await resolvePortfolioScope(user);
    return this.clients.findOne(scope, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'COLLECTOR')
  async update(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.clients.update(scope, id, dto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@CurrentUser() user: ScopeUser, @Param('id', ParseIntPipe) id: number) {
    const scope = await resolvePortfolioScope(user);
    return this.clients.remove(scope, id, user.id);
  }
}
