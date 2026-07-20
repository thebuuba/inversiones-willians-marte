import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @Roles('ADMIN', 'COLLECTOR')
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query.q);
  }
}
