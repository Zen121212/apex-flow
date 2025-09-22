export interface KeyData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface UploadOptions {
  workflowId?: string;
  workflowName?: string;
  autoProcess?: boolean;
  skipValidation?: boolean;
  targetDatabase?: string;
  notifications?: {
    email?: boolean;
    slack?: boolean;
  };
}

export interface SelectedWorkflow {
  id?: string;
  _id?: string;
  name?: string;
  workflowType?: string;
  approvalMethod?: string;
}

export interface FileAnalysis {
  fileName: string;
  originalFile: File;  // Preserve the original File object
  documentType: string;
  keyData: KeyData;
  confidence: number;
  suggestedWorkflow?: {
    name: string;
    id: string;
  };
  extractedText?: string;
  metadata?: {
    extractionConfidence?: number;
    documentType?: string;
    language?: string;
    fieldsFound?: number;
    totalFields?: number;
    aiFieldCount?: number;
    patternFieldCount?: number;
    extractionMethod?: string;
    extractionSummary?: string;
  };
  workflowId?: string;
  workflowName?: string;
}

export interface UploadModalData {
  files: FileAnalysis[];
  uploadOptions: UploadOptions;
  originalFiles: File[];
  selectedWorkflow?: SelectedWorkflow;
}

export interface AIAnalysisModalProps {
  isOpen: boolean;
  data: UploadModalData | null;
  onConfirm: (editedData: UploadModalData) => void;
  onCancel: () => void;
}