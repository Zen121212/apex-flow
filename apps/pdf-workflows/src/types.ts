export interface DocumentProcessingJob {
  documentId: string;
  timestamp: string;
  filename?: string;
  contentType?: string;
}

export interface Document {
  _id?: string;
  documentId: string;
  filename: string;
  contentType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: Date;
  processedAt?: Date;
  extractedText?: string;
  chunks?: DocumentChunk[];
  embeddings?: number[][];
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  text: string;
  pageNumber?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  embedding?: number[];
}

export interface ProcessingRun {
  _id?: string;
  runId: string;
  documentId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  steps: ProcessingStep[];
}

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  output?: any;
}
