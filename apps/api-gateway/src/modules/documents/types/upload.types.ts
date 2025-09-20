// Upload-related types and interfaces

export interface UploadRequestBody {
  userId?: string;
  workflowId?: string;
  documentCategory?: string;
  autoDetectWorkflow?: boolean;
  workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
}

export interface TestUploadBody {
  originalName: string;
  mimeType?: string;
  size?: number;
  content?: string;
  userId?: string;
  workflowId?: string;
  documentCategory?: string;
}

export interface FileUploadResult {
  fileId: string;
  filename: string;
}

export interface FileDownloadResult {
  stream: any; // GridFSBucketReadStream
  metadata: {
    filename: string;
    contentType: string;
    length: number;
    uploadDate: Date;
  };
}

export interface UploadAnalysisRequest {
  filename: string;
  content: string;
  mimeType?: string;
  language?: string;
}
