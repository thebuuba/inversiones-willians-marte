import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CollectionInteractionsService } from './collection-interactions.service';
import { CreateCollectionInteractionDto } from './dto/create-collection-interaction.dto';

@Controller('collection-interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'COLLECTOR')
export class CollectionInteractionsController {
  constructor(private collectionInteractions: CollectionInteractionsService) {}

  @Post()
  create(@Body() dto: CreateCollectionInteractionDto, @CurrentUser('id') userId: string) {
    return this.collectionInteractions.create(dto, userId);
  }

  @Get('loan/:loanId')
  findByLoan(@Param('loanId') loanId: string) {
    return this.collectionInteractions.findByLoan(loanId);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.collectionInteractions.findByClient(clientId);
  }
}
