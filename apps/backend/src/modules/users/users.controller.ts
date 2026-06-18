import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto, @CurrentUser('id') userId: string) {
    return this.users.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLECTOR')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post(':id/toggle-active')
  @Roles('ADMIN')
  toggleActive(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.users.toggleActive(id, userId);
  }
}
