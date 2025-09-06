import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationsApiService } from '../../../services/integrations.service';
import type { Integration, IntegrationType, TestResult } from '../types/index';

// Flexible config type that can handle any integration configuration
type IntegrationConfig = Record<string, unknown>;

// Query Keys
export const integrationsKeys = {
  all: ['integrations'] as const,
  lists: () => [...integrationsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...integrationsKeys.lists(), filters] as const,
  details: () => [...integrationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...integrationsKeys.details(), id] as const,
};

// Hooks for querying integrations
export function useIntegrations() {
  return useQuery({
    queryKey: integrationsKeys.lists(),
    queryFn: () => integrationsApiService.getAllIntegrations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: integrationsKeys.detail(id),
    queryFn: () => integrationsApiService.getIntegration(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations for modifying integrations
export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: IntegrationType;
      name: string;
      description?: string;
      config: IntegrationConfig;
    }) => integrationsApiService.createIntegration(data),
    onSuccess: (newIntegration) => {
      // Add the new integration to the cache
      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) => [newIntegration, ...old]
      );
      
      // Cache the individual integration
      queryClient.setQueryData(
        integrationsKeys.detail(newIntegration.id.toString()),
        newIntegration
      );
    },
    onError: (error) => {
      console.error('Failed to create integration:', error);
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      data 
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        config?: IntegrationConfig;
        enabled?: boolean;
      };
    }) => integrationsApiService.updateIntegration(id, data),
    onSuccess: (updatedIntegration, variables) => {
      // Update the integration in the list
      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) =>
          old.map(integration =>
            integration.id.toString() === variables.id ? updatedIntegration : integration
          )
      );
      
      // Update the individual integration cache
      queryClient.setQueryData(
        integrationsKeys.detail(variables.id),
        updatedIntegration
      );
    },
    onError: (error) => {
      console.error('Failed to update integration:', error);
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsApiService.deleteIntegration(id),
    onSuccess: (_, deletedId) => {
      // Remove from the list
      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) =>
          old.filter(integration => integration.id.toString() !== deletedId)
      );
      
      // Remove individual cache
      queryClient.removeQueries({
        queryKey: integrationsKeys.detail(deletedId)
      });
    },
    onError: (error) => {
      console.error('Failed to delete integration:', error);
    },
  });
}

export function useTestIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsApiService.testIntegration(id),
    onMutate: async (id: string) => {
      // Optimistically update the integration status to "testing"
      await queryClient.cancelQueries({ queryKey: integrationsKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: integrationsKeys.lists() });

      const previousIntegration = queryClient.getQueryData(integrationsKeys.detail(id));
      const previousIntegrations = queryClient.getQueryData(integrationsKeys.lists());

      // Update individual integration
      queryClient.setQueryData(
        integrationsKeys.detail(id),
        (old: Integration | undefined) => 
          old ? { ...old, status: 'testing' as const } : old
      );

      // Update in the list
      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) =>
          old.map(integration =>
            integration.id.toString() === id 
              ? { ...integration, status: 'testing' as const }
              : integration
          )
      );

      return { previousIntegration, previousIntegrations, id };
    },
    onSuccess: (result: TestResult, id: string) => {
      // Update the integration with the test result
      const updateIntegration = (integration: Integration) => ({
        ...integration,
        status: result.success ? 'connected' as const : 'error' as const,
        lastConnected: result.success ? new Date() : integration.lastConnected,
        lastError: result.success ? undefined : result.message,
      });

      queryClient.setQueryData(
        integrationsKeys.detail(id),
        (old: Integration | undefined) => old ? updateIntegration(old) : old
      );

      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) =>
          old.map(integration =>
            integration.id.toString() === id ? updateIntegration(integration) : integration
          )
      );
    },
    onError: (error, id, context) => {
      // Revert optimistic update on error
      if (context?.previousIntegration) {
        queryClient.setQueryData(integrationsKeys.detail(id), context.previousIntegration);
      }
      if (context?.previousIntegrations) {
        queryClient.setQueryData(integrationsKeys.lists(), context.previousIntegrations);
      }
      console.error('Failed to test integration:', error);
    },
  });
}

export function useToggleIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsApiService.toggleIntegration(id),
    onMutate: async (id: string) => {
      // Optimistically toggle the integration
      await queryClient.cancelQueries({ queryKey: integrationsKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: integrationsKeys.lists() });

      const previousIntegration = queryClient.getQueryData(integrationsKeys.detail(id));
      const previousIntegrations = queryClient.getQueryData(integrationsKeys.lists());

      const toggleIntegration = (integration: Integration) => ({
        ...integration,
        enabled: !integration.enabled,
        updatedAt: new Date(),
      });

      // Update individual integration
      queryClient.setQueryData(
        integrationsKeys.detail(id),
        (old: Integration | undefined) => old ? toggleIntegration(old) : old
      );

      // Update in the list
      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) =>
          old.map(integration =>
            integration.id.toString() === id ? toggleIntegration(integration) : integration
          )
      );

      return { previousIntegration, previousIntegrations };
    },
    onSuccess: (updatedIntegration, id) => {
      // Update with the actual response from the server
      queryClient.setQueryData(integrationsKeys.detail(id), updatedIntegration);
      queryClient.setQueryData(
        integrationsKeys.lists(),
        (old: Integration[] = []) =>
          old.map(integration =>
            integration.id.toString() === id ? updatedIntegration : integration
          )
      );
    },
    onError: (error, id, context) => {
      // Revert optimistic update on error
      if (context?.previousIntegration) {
        queryClient.setQueryData(integrationsKeys.detail(id), context.previousIntegration);
      }
      if (context?.previousIntegrations) {
        queryClient.setQueryData(integrationsKeys.lists(), context.previousIntegrations);
      }
      console.error('Failed to toggle integration:', error);
    },
  });
}
