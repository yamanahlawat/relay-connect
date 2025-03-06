'use client';

import { InfiniteScrollSelect } from '@/components/custom/InfiniteScrollSelect';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { updateChatSession } from '@/lib/api/chatSessions';
import type { components } from '@/lib/api/schema';
import { useModel, useModelsWithLoading } from '@/lib/queries/models';
import { useProvidersWithLoading } from '@/lib/queries/providers';
import { useProviderModel } from '@/stores/providerModel';
import { Tooltip } from '@radix-ui/react-tooltip';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type SessionUpdate = components['schemas']['SessionUpdate'];

interface PreviousState {
  providerId: string | undefined;
  modelId: string | undefined;
}

export default function ProviderModelSelect() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;
  const queryClient = useQueryClient();
  const previousState = useRef<PreviousState>({ providerId: undefined, modelId: undefined });
  const pathname = usePathname();
  const [seenModelIds, setSeenModelIds] = useState<Set<string>>(new Set());

  const { selectedProvider, selectedModel, setSelectedProvider, setSelectedModel, setLoading } = useProviderModel();

  // Pagination state with debounced search
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const LIMIT = 10;

  // Fetch selected model if it exists - this will now run on mount if there's a selected model
  const { data: selectedModelData, isLoading: isLoadingSelectedModel } = useModel(selectedModel?.id);

  // Initialize selected model and track initial state for rollback
  useEffect(() => {
    if (selectedModelData && !seenModelIds.has(selectedModelData.id)) {
      setSeenModelIds((prev) => new Set([...prev, selectedModelData.id]));
      setSelectedModel(selectedModelData);

      // Store in previous state when initially set
      if (!previousState.current.modelId) {
        previousState.current = {
          providerId: selectedProvider?.id,
          modelId: selectedModelData.id,
        };
      }
    }
  }, [selectedModelData, seenModelIds, setSelectedModel, selectedProvider?.id]);

  // Fetch providers with pagination - only active ones
  const {
    data: providersData,
    isLoading: isLoadingProviders,
    isError: isProvidersError,
    error: providersError,
    fetchNextPage: fetchNextProviders,
    hasNextPage: hasMoreProviders,
    isFetching: isSearchingProviders,
  } = useProvidersWithLoading(true, {
    onLoadingChange: setLoading,
    limit: LIMIT,
    providerName: providerSearch || undefined,
    isActive: true, // Only show active providers
  });

  const providers = useMemo(() => providersData?.pages.flatMap((page) => page || []) ?? [], [providersData]);

  // Prepare initial data for models query if we have selected model
  const initialModelsData = useMemo(() => {
    if (selectedModelData && !seenModelIds.has(selectedModelData.id)) {
      return [selectedModelData];
    }
    return undefined;
  }, [selectedModelData, seenModelIds]);

  // Fetch models with pagination - only when provider is selected and only active models
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    isError: isModelsError,
    error: modelsError,
    fetchNextPage: fetchNextModels,
    hasNextPage: hasMoreModels,
    isFetching: isSearchingModels,
  } = useModelsWithLoading(selectedProvider?.id, !!selectedProvider, {
    onLoadingChange: setLoading,
    limit: LIMIT,
    modelName: modelSearch || undefined,
    initialData: initialModelsData,
    isActive: true, // Only show active models
  });

  // Combine and deduplicate models with memoization
  const models = useMemo(() => {
    // Skip processing if no data yet
    if (!modelsData) return [];

    const allModels = modelsData.pages.flatMap((page) => page || []);

    // Only add selectedModel if needed and it exists
    if (!selectedModelData) return allModels;

    // Check if selected model is already in the list
    if (allModels.some((m) => m.id === selectedModelData.id)) {
      return allModels;
    }

    // Add selected model to the beginning and return
    return [selectedModelData, ...allModels];
  }, [modelsData, selectedModelData]);

  // Update seen model IDs when new models are loaded - with optimization
  useEffect(() => {
    if (!models.length) return;

    // Only collect IDs that haven't been seen yet
    const newIds = models.map((model) => model.id).filter((id) => !seenModelIds.has(id));

    if (newIds.length === 0) return;

    setSeenModelIds((prev) => new Set([...prev, ...newIds]));
  }, [models, seenModelIds]);

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

  // Handle provider change with improved error handling
  const handleProviderChange = useCallback(
    (providerId: string) => {
      // Skip if already selected or in updating state
      if (providerId === selectedProvider?.id || updateSessionMutation.isPending) return;

      const provider = providers.find((p) => p.id === providerId);
      if (!provider) {
        toast.error('Invalid provider selected');
        return;
      }

      setSelectedProvider(provider);
      setSelectedModel(undefined);
      setSeenModelIds(new Set()); // Reset seen models when provider changes
      setModelSearch(''); // Reset model search when provider changes
      setProviderSearch(''); // Reset provider search when provider is selected
    },
    [providers, selectedProvider?.id, setSelectedProvider, setSelectedModel, updateSessionMutation.isPending]
  );

  // Handle model change with improved validation
  const handleModelChange = useCallback(
    (modelId: string) => {
      // Skip if no provider, already selected, or in updating state
      if (!selectedProvider || modelId === selectedModel?.id || updateSessionMutation.isPending) return;

      const model = models.find((m) => m.id === modelId);
      if (!model) {
        toast.error('Invalid model selected');
        return;
      }

      setSelectedModel(model);
      setModelSearch(''); // Reset search when model is selected

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
    [sessionId, selectedProvider, selectedModel?.id, models, setSelectedModel, updateSessionMutation]
  );

  // Handle provider search
  const handleProviderSearch = useCallback((query: string) => {
    setProviderSearch(query);
  }, []);

  // Handle model search
  const handleModelSearch = useCallback((query: string) => {
    setModelSearch(query);
  }, []);

  // Combined error handling with more details
  useEffect(() => {
    if (isProvidersError || isModelsError) {
      const error = isProvidersError ? providersError : modelsError;
      const message = isProvidersError
        ? 'Failed to load providers'
        : `Failed to load models for provider ${selectedProvider?.name || 'unknown'}`;

      toast.error(error instanceof Error ? error.message : message);
    }
  }, [isProvidersError, isModelsError, providersError, modelsError, selectedProvider?.name]);

  const isUpdating = sessionId ? updateSessionMutation.isPending : false;

  // Platform detection for keyboard shortcuts
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/macintosh/i.test(navigator.userAgent));
  }, []);

  // Keyboard shortcut for new chat
  useEffect(() => {
    const handleNewChatShortcut = (e: KeyboardEvent) => {
      if ((isMac ? e.metaKey && e.shiftKey : e.ctrlKey && e.shiftKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/');
      }
    };

    document.addEventListener('keydown', handleNewChatShortcut);
    return () => document.removeEventListener('keydown', handleNewChatShortcut);
  }, [router, isMac]);

  // Memoize disabled states to avoid recalculations
  const providerSelectDisabled = isLoadingProviders || isProvidersError || isUpdating;
  const modelSelectDisabled = !selectedProvider || isLoadingModels || isModelsError || isUpdating;

  return (
    <div className="flex w-full items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <InfiniteScrollSelect
          value={selectedProvider?.id}
          onValueChange={handleProviderChange}
          disabled={providerSelectDisabled}
          placeholder={isProvidersError ? 'Error loading' : 'Select Provider'}
          items={providers}
          itemId="id"
          itemLabel="name"
          isLoading={isLoadingProviders}
          hasMore={!!hasMoreProviders}
          onLoadMore={fetchNextProviders}
          onSearch={handleProviderSearch}
          searchPlaceholder="Search providers..."
          isSearching={isSearchingProviders}
        />

        <InfiniteScrollSelect
          value={selectedModel?.id}
          onValueChange={handleModelChange}
          disabled={modelSelectDisabled}
          placeholder={!selectedProvider ? 'Select provider first' : isModelsError ? 'Error loading' : 'Select Model'}
          items={models}
          itemId="id"
          itemLabel="name"
          isLoading={isLoadingModels || isLoadingSelectedModel}
          hasMore={!!hasMoreModels}
          onLoadMore={fetchNextModels}
          onSearch={handleModelSearch}
          searchPlaceholder="Search models..."
          isSearching={isSearchingModels}
        />
      </div>

      <div className="flex items-center gap-4">
        {pathname !== '/' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button variant="ghost" size="icon" aria-label="New Chat">
                    <MessageSquarePlus className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Chat ({isMac ? '⌘' : 'Ctrl'} + Shift + N)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
