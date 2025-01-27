'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateChatSession } from '@/lib/api/chatSessions';
import { listModels } from '@/lib/api/models';
import { listProviders } from '@/lib/api/providers';
import type { components } from '@/lib/api/schema';
import { useProviderModel } from '@/stores/providerModel';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type SessionUpdate = components['schemas']['SessionUpdate'];

interface PreviousState {
  providerId: string | undefined;
  modelId: string | undefined;
}

export default function ProviderModelSelect() {
  const params = useParams();
  const sessionId = params.session_id as string;
  const queryClient = useQueryClient();
  const previousState = useRef<PreviousState>({ providerId: undefined, modelId: undefined });

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
    enabled: !!selectedProvider?.id,
  });

  // Session update mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ update }: { update: SessionUpdate }) => updateChatSession(sessionId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      previousState.current = {
        providerId: selectedProvider?.id,
        modelId: selectedModel?.id,
      };
    },
    onError: () => {
      toast.error('Failed to update session settings');
      // Rollback to previous state on error
      const previousProvider = providers.find((p) => p.id === previousState.current.providerId);
      const previousModel = models.find((m) => m.id === previousState.current.modelId);

      if (previousProvider) setSelectedProvider(previousProvider);
      if (previousModel) setSelectedModel(previousModel);
    },
  });

  // Handle provider change
  const handleProviderChange = useCallback(
    (providerId: string) => {
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) {
        toast.error('Invalid provider selected');
        return;
      }

      setSelectedProvider(provider);
      setSelectedModel(undefined);
    },
    [providers, setSelectedProvider, setSelectedModel]
  );

  // Handle model change
  const handleModelChange = useCallback(
    (modelId: string) => {
      if (!selectedProvider) return;

      const model = models.find((m) => m.id === modelId);
      if (!model) {
        toast.error('Invalid model selected');
        return;
      }

      setSelectedModel(model);

      // Only update session if it exists and we have both provider and model
      if (sessionId && selectedProvider) {
        updateSessionMutation.mutate({
          update: {
            provider_id: selectedProvider.id,
            llm_model_id: modelId,
          },
        });
      }
    },
    [sessionId, selectedProvider, models, setSelectedModel, updateSessionMutation]
  );

  // Combined error handling
  useEffect(() => {
    if (isProvidersError || isModelsError) {
      const error = isProvidersError ? providersError : modelsError;
      const message = isProvidersError ? 'Failed to load providers' : 'Failed to load models';
      toast.error(error instanceof Error ? error.message : message);
    }
  }, [isProvidersError, isModelsError, providersError, modelsError]);

  const isUpdating = sessionId ? updateSessionMutation.isPending : false;

  return (
    <div className="flex w-full items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedProvider?.id}
          onValueChange={handleProviderChange}
          disabled={isLoadingProviders || isProvidersError || isUpdating}
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
          onValueChange={handleModelChange}
          disabled={!selectedProvider || isLoadingModels || isModelsError || isUpdating}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue
              placeholder={
                !selectedProvider ? 'Select provider first' : isModelsError ? 'Error loading' : 'Select Model'
              }
            />
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
