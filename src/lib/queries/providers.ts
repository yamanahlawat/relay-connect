import { listProviders } from '@/lib/api/providers';
import { QueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';

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
export function useProvidersWithLoading(enabled = true, options: UseProvidersOptions = {}) {
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
export function useProviders(isActive?: boolean) {
  return useQuery({
    queryKey: providerKeys.filtered(isActive, undefined, undefined, undefined),
    queryFn: () => listProviders({ isActive, limit: 1000 }), // Fetch all providers at once for settings
  });
}

// Prefetch function for infinite loading
export async function prefetchProviders(queryClient: QueryClient, isActive?: boolean) {
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
