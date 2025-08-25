import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  async search(query: string, limit: number = 10) {
    // TODO: Implement actual search using MongoDB text search or vector search
    // For now, return static placeholder results
    return [
      {
        documentId: 'doc_example_1',
        title: 'Sample Document 1',
        excerpt: `This document contains information relevant to "${query}"...`,
        score: 0.95,
        metadata: {
          uploadedAt: '2024-01-15T10:30:00Z',
          contentType: 'application/pdf',
          fileSize: '2.1MB',
        },
      },
      {
        documentId: 'doc_example_2',
        title: 'Sample Document 2',
        excerpt: `Another document that matches your search for "${query}"...`,
        score: 0.87,
        metadata: {
          uploadedAt: '2024-01-14T15:45:00Z',
          contentType: 'application/pdf',
          fileSize: '1.8MB',
        },
      },
    ].slice(0, limit);
  }
}
