import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post(':id/toggle-active')
  @Roles('ADMIN')
  toggleActive(@Param('id') id: string) {
    return this.users.toggleActive(id);
  }
}
