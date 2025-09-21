import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../../services/api/documents';
import { workflowApi } from '../../../services/workflowApi';
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
    queryFn: async () => {
      try {
        // Try to fetch from workflow API
        const options = await workflowApi.getWorkflowOptions();
        
        // Transform to expected format
        return {
          categories: [
            { id: 'invoice', name: 'Invoice', description: 'Invoices and billing documents' },
            { id: 'contract', name: 'Contract', description: 'Legal contracts and agreements' },
            { id: 'receipt', name: 'Receipt', description: 'Purchase receipts and confirmations' },
            { id: 'form', name: 'Form', description: 'Forms and applications' },
            { id: 'legal', name: 'Legal Document', description: 'Legal documents and correspondence' },
            { id: 'general', name: 'General Document', description: 'General documents and files' },
          ],
          workflows: options.availableWorkflows || [],
        };
      } catch (error) {
        console.warn('Failed to fetch workflow options, using defaults:', error);
        // Provide fallback data if API fails
        return {
          categories: [
            { id: 'invoice', name: 'Invoice', description: 'Invoices and billing documents' },
            { id: 'contract', name: 'Contract', description: 'Legal contracts and agreements' },
            { id: 'receipt', name: 'Receipt', description: 'Purchase receipts and confirmations' },
            { id: 'form', name: 'Form', description: 'Forms and applications' },
            { id: 'legal', name: 'Legal Document', description: 'Legal documents and correspondence' },
            { id: 'general', name: 'General Document', description: 'General documents and files' },
          ],
          workflows: [],
        };
      }
    },
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
      
      // Invalidate workflow document counts if a workflow was used
      if (result.workflowSelection?.workflowId) {
        queryClient.invalidateQueries({ queryKey: [...documentsKeys.all, 'counts', 'workflows'] });
        queryClient.invalidateQueries({ queryKey: [...documentsKeys.all, 'count', 'workflow', result.workflowSelection.workflowId] });
      }

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

// Hook for getting document count by workflow ID
export function useWorkflowDocumentCount(workflowId?: string) {
  return useQuery({
    queryKey: [...documentsKeys.all, 'count', 'workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) return 0;
      
      try {
        const response = await documentAPI.getDocuments({ 
          workflowId, 
          pageSize: 1 // We only need the count
        });
        return response.total;
      } catch (error) {
        console.warn('Failed to fetch document count for workflow:', workflowId, error);
        return 0;
      }
    },
    enabled: !!workflowId,
    staleTime: 30 * 1000, // 30 seconds for faster updates
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

// Hook for getting document counts for multiple workflows
export function useWorkflowDocumentCounts(workflowIds: string[]) {
  return useQuery({
    queryKey: [...documentsKeys.all, 'counts', 'workflows', workflowIds],
    queryFn: async () => {
      if (!workflowIds.length) return {};
      
      try {
        // Fetch counts for each workflow
        const counts = await Promise.all(
          workflowIds.map(async (workflowId) => {
            try {
              const response = await documentAPI.getDocuments({ 
                workflowId, 
                pageSize: 1 
              });
              return { workflowId, count: response.total };
            } catch (error) {
              console.warn('Failed to fetch count for workflow:', workflowId, error);
              return { workflowId, count: 0 };
            }
          })
        );
        
        // Convert to object with workflowId as key
        return counts.reduce((acc, { workflowId, count }) => {
          acc[workflowId] = count;
          return acc;
        }, {} as Record<string, number>);
      } catch (error) {
        console.warn('Failed to fetch workflow document counts:', error);
        return {};
      }
    },
    enabled: workflowIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds for faster updates
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
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
      
      // Invalidate workflow document counts if a workflow was used
      if (result.workflowSelection?.workflowId) {
        queryClient.invalidateQueries({ queryKey: [...documentsKeys.all, 'counts', 'workflows'] });
        queryClient.invalidateQueries({ queryKey: [...documentsKeys.all, 'count', 'workflow', result.workflowSelection.workflowId] });
      }

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
