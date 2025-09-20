export interface FileAnalysis {
  fileName: string;
  originalFile: File;  // Preserve the original File object
  documentType: string;
  keyData: any;
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
}

export interface UploadModalData {
  files: FileAnalysis[];
  uploadOptions: any;
  originalFiles: File[];
}

export interface AIAnalysisModalProps {
  isOpen: boolean;
  data: UploadModalData | null;
  onConfirm: (editedData: UploadModalData) => void;
  onCancel: () => void;
}