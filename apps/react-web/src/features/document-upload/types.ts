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

export interface UploadOptions extends WorkflowSelectionOptions {
  // Additional upload specific options can be added here
}
