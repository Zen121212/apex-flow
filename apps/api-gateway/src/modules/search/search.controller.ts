import { Controller, Post, Body } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('query')
  async searchDocuments(@Body() body: { query: string; limit?: number }) {
    const { query, limit = 10 } = body;
    
    const results = await this.searchService.search(query, limit);
    
    return {
      query,
      results,
      total: results.length,
    };
  }
}
