import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Provider {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

interface ProviderModelState {
  // State
  selectedProvider?: Provider;
  selectedModel?: Model;
  isLoading: boolean;

  // Actions
  setSelectedProvider: (provider: Provider | undefined) => void;
  setSelectedModel: (model: Model | undefined) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useProviderModel = create<ProviderModelState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        selectedProvider: undefined,
        selectedModel: undefined,
        isLoading: false,

        // Actions
        setSelectedProvider: (provider) =>
          set({
            selectedProvider: provider,
            selectedModel: undefined, // Reset model when provider changes
          }),
        setSelectedModel: (model) => set({ selectedModel: model }),
        setLoading: (loading) => set({ isLoading: loading }),
        reset: () =>
          set({
            selectedProvider: undefined,
            selectedModel: undefined,
          }),
      }),
      {
        name: 'provider-model-storage', // Storage key
        partialize: (state) => ({
          // Only persist these fields
          selectedProvider: state.selectedProvider,
          selectedModel: state.selectedModel,
        }),
      }
    )
  )
);

export const useSelectedProvider = () => useProviderModel((state) => state.selectedProvider);
export const useSelectedModel = () => useProviderModel((state) => state.selectedModel);
export const useProviderModelLoading = () => useProviderModel((state) => state.isLoading);
