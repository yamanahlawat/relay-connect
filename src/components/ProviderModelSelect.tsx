'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listModels } from '@/lib/api/models';
import { listProviders } from '@/lib/api/providers';
import { useProviderModel } from '@/stores/providerModel';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ProviderModelSelect() {
  const { selectedProvider, selectedModel, setSelectedProvider, setSelectedModel, setLoading } = useProviderModel();

  // Fetch providers
  const {
    data: providers = [],
    isLoading: isLoadingProviders,
    isError: isProvidersError,
    error: providersError,
  } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      setLoading(true);
      try {
        return await listProviders();
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch models for selected provider
  const {
    data: models = [],
    isLoading: isLoadingModels,
    isError: isModelsError,
    error: modelsError,
  } = useQuery({
    queryKey: ['models', selectedProvider?.id],
    queryFn: async () => {
      if (!selectedProvider?.id) return [];
      setLoading(true);
      try {
        return await listModels(selectedProvider.id);
      } finally {
        setLoading(false);
      }
    },
    enabled: Boolean(selectedProvider?.id),
  });

  // Handle errors
  useEffect(() => {
    if (isProvidersError) {
      toast.error(`Failed to load providers: ${providersError.message}`);
    }
  }, [isProvidersError, providersError]);

  useEffect(() => {
    if (isModelsError) {
      toast.error(`Failed to load models: ${modelsError.message}`);
    }
  }, [isModelsError, modelsError]);

  return (
    <div className="flex w-full items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedProvider?.id}
          onValueChange={(id) => {
            const provider = providers.find((p) => p.id === id);
            setSelectedProvider(provider);
            setSelectedModel(undefined); // Clear model when provider changes
          }}
          disabled={isLoadingProviders || isProvidersError}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={isProvidersError ? 'Error loading' : 'Select Provider'} />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedModel?.id}
          onValueChange={(id) => {
            const model = models.find((m) => m.id === id);
            setSelectedModel(model);
          }}
          disabled={!selectedProvider || isLoadingModels || isModelsError}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder={isModelsError ? 'Error loading' : 'Select Model'} />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </div>
  );
}
