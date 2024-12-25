'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listModels } from '@/lib/api/models';
import { listProviders } from '@/lib/api/providers';
import { useProviderModel } from '@/stores/providerModel';
import { useQuery } from '@tanstack/react-query';

export default function ProviderModelSelect() {
  const { selectedProvider, selectedModel, setSelectedProvider, setSelectedModel, setLoading } = useProviderModel();

  // Fetch providers
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
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
  const { data: models = [], isLoading: isLoadingModels } = useQuery({
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
    enabled: !!selectedProvider?.id,
  });

  return (
    <div className="flex items-center gap-4">
      <Select
        value={selectedProvider?.id}
        onValueChange={(id) => {
          const provider = providers.find((p) => p.id === id);
          setSelectedProvider(provider);
        }}
        disabled={isLoadingProviders}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select Provider" />
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
        disabled={!selectedProvider || isLoadingModels}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select Model" />
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
  );
}
