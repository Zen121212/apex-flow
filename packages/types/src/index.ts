import { z } from 'zod';

// Document-related types
export const DocumentSchema = z.object({
  documentId: z.string(),
  filename: z.string(),
  contentType: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  uploadedAt: z.date(),
  processedAt: z.date().optional(),
  extractedText: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const DocumentChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  text: z.string(),
  pageNumber: z.number().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  embedding: z.array(z.number()).optional(),
});

export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;

// Search-related types
export const SearchQuerySchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
  filters: z.record(z.any()).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchResultSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  excerpt: z.string(),
  score: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Processing-related types
export const ProcessingRunSchema = z.object({
  runId: z.string(),
  documentId: z.string(),
  status: z.enum(['running', 'completed', 'failed']),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  steps: z.array(z.object({
    name: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    error: z.string().optional(),
    output: z.any().optional(),
  })),
});

export type ProcessingRun = z.infer<typeof ProcessingRunSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};

// Upload types
export const UploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string().optional(),
});

export type UploadRequest = z.infer<typeof UploadRequestSchema>;

export const UploadResponseSchema = z.object({
  documentId: z.string(),
  uploadUrl: z.string(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;
