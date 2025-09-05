export interface WorkflowOption {
  id: string;
  name: string;
  description: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  workflowId: string;
  description: string;
}

export interface WorkflowOptionsResponse {
  workflows: WorkflowOption[];
  categories: CategoryOption[];
}

export interface DocumentUploadRequest {
  originalName: string;
  mimeType?: string;
  size?: number;
  content?: string;
  workflowId?: string;
  documentCategory?: string;
  autoDetectWorkflow?: boolean;
  workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
}

export interface WorkflowSelectionResult {
  workflowId: string | null;
  method: 'manual' | 'auto' | 'hybrid' | 'default';
  confidence: number;
  reason: string;
  alternativeWorkflows?: string[];
}

export interface ExecutionResult {
  id: string;
  status: string;
  startedAt: string;
  [key: string]: any;
}

export interface DocumentUploadResponse {
  documentId: string;
  workflowSelection: WorkflowSelectionResult;
  execution?: ExecutionResult;
}

// Document listing types
export interface DocumentItem {
  id: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  category?: string | null;
  workflowId?: string | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface DocumentListFilters {
  query?: string; // text search on name
  category?: string;
  workflowId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  from?: string; // ISO start date
  to?: string;   // ISO end date
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'size';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
  page: number;
  pageSize: number;
}
