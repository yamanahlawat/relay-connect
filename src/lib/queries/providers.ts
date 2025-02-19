import { listProviders } from '@/lib/api/providers';
import { QueryClient, useQuery } from '@tanstack/react-query';

// Query keys
export const providerKeys = {
  all: ['providers'] as const,
  filtered: (isActive: boolean | undefined) => [...providerKeys.all, { isActive }] as const,
};

// Query hooks
export function useProviders(isActive?: boolean) {
  return useQuery({
    queryKey: providerKeys.filtered(isActive),
    queryFn: () => listProviders(isActive),
  });
}

// Query hook with loading state management
export function useProvidersWithLoading(
  isActive?: boolean,
  { onLoadingChange }: { onLoadingChange?: (loading: boolean) => void } = {}
) {
  return useQuery({
    queryKey: providerKeys.filtered(isActive),
    queryFn: async () => {
      onLoadingChange?.(true);
      try {
        return await listProviders(isActive);
      } finally {
        onLoadingChange?.(false);
      }
    },
  });
}

// Prefetch function
export async function prefetchProviders(queryClient: QueryClient, isActive?: boolean) {
  await queryClient.prefetchQuery({
    queryKey: providerKeys.filtered(isActive),
    queryFn: () => listProviders(isActive),
  });
}
