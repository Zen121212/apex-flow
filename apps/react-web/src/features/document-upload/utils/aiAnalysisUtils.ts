import type { FileAnalysis, UploadModalData } from '../types/AIAnalysisTypes';

/**
 * Transforms raw document analysis data into the format expected by AIAnalysisModal
 */
export function transformAnalysisData(
  analyzedFiles: File[],
  analysisResults: any[],
  uploadOptions: any = {}
): UploadModalData {
  const transformedFiles: FileAnalysis[] = analyzedFiles.map((file, index) => {
    const analysis = analysisResults[index] || {};
    
    return {
      fileName: file.name,
      originalFile: file,
      documentType: analysis.documentType || 'unknown',
      confidence: analysis.confidence || 0,
      keyData: analysis.extractedData || {},
      suggestedWorkflow: analysis.workflow ? {
        name: analysis.workflow.name || 'Default Processing',
        id: analysis.workflow.id || 'default'
      } : undefined,
      extractedText: analysis.extractedText,
      metadata: {
        extractionConfidence: analysis.confidence,
        documentType: analysis.documentType,
        language: analysis.language || 'en',
        fieldsFound: analysis.fieldsFound || 0,
        totalFields: analysis.totalFields || 0,
        aiFieldCount: analysis.aiFieldCount || 0,
        patternFieldCount: analysis.patternFieldCount || 0,
        extractionMethod: analysis.extractionMethod || 'AI-Assisted',
        extractionSummary: analysis.summary || 'Document analysis completed'
      }
    };
  });

  return {
    files: transformedFiles,
    uploadOptions,
    originalFiles: analyzedFiles
  };
}

/**
 * Validates if the analysis data has the required fields
 */
export function validateAnalysisData(data: any): boolean {
  if (!data || !Array.isArray(data)) return false;

  return data.every(item => {
    return (
      item &&
      typeof item === 'object' &&
      // Required fields
      'documentType' in item &&
      'confidence' in item &&
      'extractedData' in item
    );
  });
}

/**
 * Formats the confidence score as a percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Formats field names for display
 */
export function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle camelCase
    .trim();
}