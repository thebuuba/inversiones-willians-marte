import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  async search(@CurrentUser() user: ScopeUser, @Query() query: SearchQueryDto) {
    const scope = await resolvePortfolioScope(user);
    return this.searchService.search(scope, query.q);
  }
}
