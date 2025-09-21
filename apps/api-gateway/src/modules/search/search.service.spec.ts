import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('search', () => {
    it('should return default search results', async () => {
      const results = await service.search('test query');

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('documentId', 'doc_example_1');
      expect(results[0]).toHaveProperty('title', 'Sample Document 1');
      expect(results[0]).toHaveProperty('score', 0.95);
      expect(results[0].excerpt).toContain('test query');
    });

    it('should respect limit parameter', async () => {
      const results = await service.search('test query', 1);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('documentId', 'doc_example_1');
    });

    it('should handle zero limit', async () => {
      const results = await service.search('test query', 0);

      expect(results).toHaveLength(0);
    });

    it('should handle large limit', async () => {
      const results = await service.search('test query', 100);

      expect(results).toHaveLength(2); // Only 2 default results available
    });

    it('should include query in excerpt', async () => {
      const query = 'specific search term';
      const results = await service.search(query);

      results.forEach(result => {
        expect(result.excerpt).toContain(query);
      });
    });

    it('should return results with proper metadata', async () => {
      const results = await service.search('test');

      results.forEach(result => {
        expect(result).toHaveProperty('metadata');
        expect(result.metadata).toHaveProperty('uploadedAt');
        expect(result.metadata).toHaveProperty('contentType', 'application/pdf');
        expect(result.metadata).toHaveProperty('fileSize');
      });
    });

    it('should return results sorted by score descending', async () => {
      const results = await service.search('test');

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });
  });
});