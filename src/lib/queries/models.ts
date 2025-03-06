import { getModel, listModels, listModelsByProvider } from '@/lib/api/models';
import { ModelRead } from '@/types/model';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// Query keys for models
export const modelKeys = {
  all: ['models'] as const,
  filtered: (providerId: string | undefined, isActive?: boolean) =>
    [...modelKeys.all, { providerId, isActive }] as const,
  byProvider: ['models', 'byProvider'] as const,
  detail: (modelId: string) => [...modelKeys.all, 'detail', modelId] as const,
};

interface UseModelsOptions {
  onLoadingChange?: (loading: boolean) => void;
  limit?: number;
  offset?: number;
  modelName?: string;
  initialData?: ModelRead[];
  isActive?: boolean;
}

// New hook to fetch a single model
export function useModelQuery(modelId: string | undefined) {
  return useQuery({
    queryKey: modelKeys.detail(modelId!),
    queryFn: () => getModel(modelId!),
    enabled: !!modelId,
  });
}

// Updated query hook with infinite loading for dropdowns
export function useModelsWithLoadingQuery(
  providerId: string | undefined,
  enabled = true,
  options: UseModelsOptions = {}
) {
  const { onLoadingChange, limit = 10, modelName, initialData, isActive } = options;

  return useInfiniteQuery({
    queryKey: ['models', providerId, { limit, modelName, isActive }],
    queryFn: async ({ pageParam = 0 }) => {
      if (!providerId) return [] as ModelRead[];
      onLoadingChange?.(true);
      try {
        return await listModels({
          provider_id: providerId,
          limit,
          offset: pageParam,
          modelName,
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
    enabled: enabled && !!providerId,
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [0],
        }
      : undefined,
  });
}

// Query hook to fetch models grouped by provider
export function useModelsByProviderQuery() {
  return useQuery({
    queryKey: modelKeys.byProvider,
    queryFn: listModelsByProvider,
  });
}
