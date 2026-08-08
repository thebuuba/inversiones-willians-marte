import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';
import { CollectionInteractionsService } from './collection-interactions.service';
import { CreateCollectionInteractionDto } from './dto/create-collection-interaction.dto';

@Controller('collection-interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'COLLECTOR')
export class CollectionInteractionsController {
  constructor(private collectionInteractions: CollectionInteractionsService) {}

  @Post()
  async create(@Body() dto: CreateCollectionInteractionDto, @CurrentUser() user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    return this.collectionInteractions.create(scope, dto, user.id);
  }

  @Get('loan/:loanId')
  async findByLoan(@CurrentUser() user: ScopeUser, @Param('loanId') loanId: string) {
    const scope = await resolvePortfolioScope(user);
    return this.collectionInteractions.findByLoan(scope, loanId);
  }

  @Get('client/:clientId')
  async findByClient(
    @CurrentUser() user: ScopeUser,
    @Param('clientId', ParseIntPipe) clientId: number,
  ) {
    const scope = await resolvePortfolioScope(user);
    return this.collectionInteractions.findByClient(scope, clientId);
  }
}
