import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: SearchService;

  const mockSearchService = {
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchDocuments', () => {
    it('should return search results with default limit', async () => {
      const mockResults = [
        {
          documentId: 'doc1',
          title: 'Test Document',
          excerpt: 'Test excerpt',
          score: 0.95,
        },
      ];

      mockSearchService.search.mockResolvedValue(mockResults);

      const result = await controller.searchDocuments({ query: 'test query' });

      expect(searchService.search).toHaveBeenCalledWith('test query', 10);
      expect(result).toEqual({
        query: 'test query',
        results: mockResults,
        total: 1,
      });
    });

    it('should return search results with custom limit', async () => {
      const mockResults = [
        { documentId: 'doc1', title: 'Test Document 1', excerpt: 'Test excerpt 1', score: 0.95 },
        { documentId: 'doc2', title: 'Test Document 2', excerpt: 'Test excerpt 2', score: 0.90 },
      ];

      mockSearchService.search.mockResolvedValue(mockResults);

      const result = await controller.searchDocuments({ 
        query: 'test query', 
        limit: 5 
      });

      expect(searchService.search).toHaveBeenCalledWith('test query', 5);
      expect(result).toEqual({
        query: 'test query',
        results: mockResults,
        total: 2,
      });
    });

    it('should handle empty search results', async () => {
      mockSearchService.search.mockResolvedValue([]);

      const result = await controller.searchDocuments({ query: 'nonexistent' });

      expect(searchService.search).toHaveBeenCalledWith('nonexistent', 10);
      expect(result).toEqual({
        query: 'nonexistent',
        results: [],
        total: 0,
      });
    });

    it('should handle search service errors', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Search failed'));

      await expect(
        controller.searchDocuments({ query: 'test query' })
      ).rejects.toThrow('Search failed');
    });
  });
});