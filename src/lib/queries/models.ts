import { listModels, listModelsByProvider } from '@/lib/api/models';
import { ModelRead, ModelsByProvider } from '@/types/model';
import { useQuery } from '@tanstack/react-query';

// Query keys for models
export const modelKeys = {
  all: ['models'] as const,
  filtered: (providerId: string | undefined, isActive: boolean | undefined) =>
    providerId ? ([...modelKeys.all, providerId, { isActive }] as const) : modelKeys.all,
  byProvider: ['models', 'byProvider'] as const,
};

// Query hook with loading state management for a specific provider
export function useModelsWithLoading(
  providerId: string | undefined,
  isActive?: boolean,
  { onLoadingChange }: { onLoadingChange?: (loading: boolean) => void } = {}
) {
  return useQuery<ModelRead[]>({
    queryKey: modelKeys.filtered(providerId, isActive),
    queryFn: async () => {
      if (!providerId) return [];
      onLoadingChange?.(true);
      try {
        return await listModels(providerId, isActive);
      } finally {
        onLoadingChange?.(false);
      }
    },
    enabled: !!providerId,
  });
}

// Query hook to fetch models grouped by provider
export function useModelsByProvider() {
  return useQuery<ModelsByProvider>({
    queryKey: modelKeys.byProvider,
    queryFn: listModelsByProvider,
  });
}
