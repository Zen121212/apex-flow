export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface WorkflowSelectionOptions {
  workflowId?: string;
  documentCategory?: string;
  autoDetectWorkflow: boolean;
  workflowSelectionMode: 'manual' | 'auto' | 'hybrid';
}

// Type alias for upload options - currently same as WorkflowSelectionOptions
// but can be extended in the future with upload-specific properties
export type UploadOptions = WorkflowSelectionOptions;
