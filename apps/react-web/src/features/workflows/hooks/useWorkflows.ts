import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi, WorkflowDefinition } from '../../../services/workflowApi';

// Query Keys
export const workflowsKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...workflowsKeys.lists(), filters] as const,
  details: () => [...workflowsKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowsKeys.details(), id] as const,
  options: () => [...workflowsKeys.all, 'options'] as const,
};

// Hook for fetching all workflows
export function useWorkflows() {
  return useQuery({
    queryKey: workflowsKeys.list(),
    queryFn: () => workflowApi.getWorkflows(),
    staleTime: 0, // Always fresh in development - change to 5 * 60 * 1000 for production
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching a single workflow
export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowsKeys.detail(id),
    queryFn: () => workflowApi.getWorkflow(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for fetching workflow options
export function useWorkflowOptions() {
  return useQuery({
    queryKey: workflowsKeys.options(),
    queryFn: () => workflowApi.getWorkflowOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - options don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for creating workflows
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflow: Omit<WorkflowDefinition, 'id'>) => workflowApi.createWorkflow(workflow),
    onSuccess: (newWorkflow: WorkflowDefinition) => {
      // Update the workflows list cache
      queryClient.setQueryData(workflowsKeys.list(), (oldData: WorkflowDefinition[] | undefined) => {
        if (!oldData) return [newWorkflow];
        return [...oldData, newWorkflow];
      });

      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: workflowsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowsKeys.options() });

      console.log('Workflow created successfully:', newWorkflow);
    },
    onError: (error) => {
      console.error('Failed to create workflow:', error);
    },
  });
}

// Hook for updating workflows
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkflowDefinition> }) => 
      workflowApi.updateWorkflow(id, updates),
    onSuccess: (updatedWorkflow: WorkflowDefinition, { id }) => {
      // Update the workflows list cache
      queryClient.setQueryData(workflowsKeys.list(), (oldData: WorkflowDefinition[] | undefined) => {
        if (!oldData) return [updatedWorkflow];
        return oldData.map(w => w.id === id ? updatedWorkflow : w);
      });

      // Update the individual workflow cache
      queryClient.setQueryData(workflowsKeys.detail(id), updatedWorkflow);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: workflowsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowsKeys.options() });

      console.log('Workflow updated successfully:', updatedWorkflow);
    },
    onError: (error) => {
      console.error('Failed to update workflow:', error);
    },
  });
}

// Hook for deleting workflows
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workflowApi.deleteWorkflow(id),
    onSuccess: (_, deletedId) => {
      // Remove from workflows list cache
      queryClient.setQueryData(workflowsKeys.list(), (oldData: WorkflowDefinition[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(w => (w._id || w.id) !== deletedId);
      });

      // Remove individual workflow cache
      queryClient.removeQueries({ queryKey: workflowsKeys.detail(deletedId) });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: workflowsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowsKeys.options() });

      console.log('Workflow deleted successfully:', deletedId);
    },
    onError: (error) => {
      console.error('Failed to delete workflow:', error);
    },
  });
}

// Hook for executing workflows
export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: ({ workflowId, options }: { 
      workflowId: string; 
      options: { documentId: string; aiData?: Record<string, unknown> }
    }) => workflowApi.executeWorkflow(workflowId, options),
    onSuccess: (execution) => {
      console.log('Workflow execution started:', execution);
    },
    onError: (error) => {
      console.error('Failed to execute workflow:', error);
    },
  });
}
