import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../../services/api/documents';
import type { DocumentUploadRequest, DocumentUploadResponse } from '../../../types/documents';

// Query Keys
export const documentsKeys = {
  all: ['documents'] as const,
  workflows: () => [...documentsKeys.all, 'workflows'] as const,
  options: () => [...documentsKeys.workflows(), 'options'] as const,
  list: (filters: import('../../../types/documents').DocumentListFilters) => [...documentsKeys.all, 'list', filters] as const,
};

// Hook for fetching workflow options
export function useWorkflowOptions() {
  return useQuery({
    queryKey: documentsKeys.options(),
    queryFn: () => documentAPI.getWorkflowOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - workflow options don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for listing documents
export function useDocumentsList(filters: import('../../../types/documents').DocumentListFilters) {
  return useQuery({
    queryKey: documentsKeys.list(filters),
    queryFn: () => documentAPI.getDocuments(filters),
    placeholderData: (previousData) => previousData,
  });
}

// Hook for uploading documents
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DocumentUploadRequest) => documentAPI.uploadDocument(data),
    onSuccess: (result: DocumentUploadResponse) => {
      // Invalidate the documents list so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });

      console.log('Document uploaded successfully:', {
        documentId: result.documentId,
        workflow: result.workflowSelection,
        execution: result.execution
      });
    },
    onError: (error) => {
      console.error('Failed to upload document:', error);
    },
  });
}

// Hook for uploading real files (when multipart is enabled)
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      file, 
      options 
    }: { 
      file: File; 
      options?: {
        workflowId?: string;
        documentCategory?: string;
        autoDetectWorkflow?: boolean;
        workflowSelectionMode?: 'manual' | 'auto' | 'hybrid';
      }
    }) => documentAPI.uploadFile(file, options),
    onSuccess: (result: DocumentUploadResponse) => {
      // Invalidate the documents list so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });

      console.log('File uploaded successfully:', {
        documentId: result.documentId,
        workflow: result.workflowSelection,
        execution: result.execution
      });
    },
    onError: (error) => {
      console.error('Failed to upload file:', error);
    },
  });
}
