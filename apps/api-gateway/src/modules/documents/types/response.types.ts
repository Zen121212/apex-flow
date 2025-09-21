// Response-related types and interfaces

export interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  workflowSelection?: any;
  execution?: any;
  document: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: Date;
  };
}

export interface DocumentListResponse {
  documents: Array<{
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: Date;
    status: string;
    processingResults?: any;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface DocumentDetailResponse {
  document: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: Date;
    status: string;
    processingResults?: any;
    analysis?: any;
  };
}

export interface ProcessingStatusResponse {
  documentId: string;
  status: string;
  progress?: number;
  message?: string;
  results?: any;
}
