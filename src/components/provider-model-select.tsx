'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listModels } from '@/lib/api/models';
import { listProviders } from '@/lib/api/providers';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';

export default function ProviderModelSelect() {
  const [selectedProvider, setSelectedProvider] = React.useState<string>();
  const [selectedModel, setSelectedModel] = React.useState<string>();

  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      return await listProviders();
    },
  });

  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['models', selectedProvider],
    queryFn: async () => {
      if (!selectedProvider) return [];
      return await listModels(selectedProvider);
    },
    enabled: !!selectedProvider,
  });

  // Auto-select first model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  // Reset selected model when provider changes
  useEffect(() => {
    setSelectedModel(undefined);
  }, [selectedProvider]);

  return (
    <div className="flex items-center gap-4">
      <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={isLoadingProviders}>
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

      <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedProvider || isLoadingModels}>
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
