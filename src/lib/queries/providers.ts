import { createProvider, deleteProvider, listProviders, updateProvider } from '@/lib/api/providers';
import type { ProviderCreate, ProviderUpdate } from '@/types/provider';
import { QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const providerKeys = {
  all: ['providers'] as const,
  filtered: (isActive: boolean | undefined, limit?: number, offset?: number, provider_name?: string) =>
    [...providerKeys.all, { isActive, limit, offset, provider_name }] as const,
};

interface UseProvidersOptions {
  onLoadingChange?: (loading: boolean) => void;
  limit?: number;
  offset?: number;
  providerName?: string;
  isActive?: boolean;
}

// Hook for infinite loading in dropdowns
export function useProvidersWithLoadingQuery(enabled = true, options: UseProvidersOptions = {}) {
  const { onLoadingChange, limit = 10, providerName, isActive } = options;

  return useInfiniteQuery({
    queryKey: ['providers', { limit, providerName, isActive }],
    queryFn: async ({ pageParam = 0 }) => {
      onLoadingChange?.(true);
      try {
        return await listProviders({
          limit,
          offset: pageParam,
          providerName,
          isActive,
        });
      } finally {
        onLoadingChange?.(false);
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length * limit;
    },
    enabled,
  });
}

// Hook for settings view - fetches all providers at once
export function useProvidersQuery(isActive?: boolean) {
  return useQuery({
    queryKey: providerKeys.filtered(isActive, undefined, undefined, undefined),
    queryFn: () => listProviders({ isActive, limit: 1000 }), // Fetch all providers at once for settings
  });
}

// Mutation hooks
export function useProviderCreateMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProviderCreate) => createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider created successfully');
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to create provider');
    },
  });
}

export function useProviderUpdateMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: ProviderUpdate }) =>
      updateProvider(providerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider updated successfully');
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to update provider');
    },
  });
}

export function useProviderDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => deleteProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete provider');
    },
  });
}

// Prefetch function for infinite loading
export async function prefetchProvidersQuery(queryClient: QueryClient, isActive?: boolean) {
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['providers', { limit: 10, providerName: undefined, isActive }],
    queryFn: async ({ pageParam = 0 }) =>
      listProviders({
        limit: 10,
        offset: pageParam,
        providerName: undefined,
        isActive,
      }),
    initialPageParam: 0,
  });
}
