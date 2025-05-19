interface Provider {
  id: string;
}

interface Model {
  id: string;
}

export function getInputPlaceholder(selectedProvider: Provider | null, selectedModel: Model | null): string {
  if (!selectedProvider || !selectedModel) return 'Select a provider and model to start...';
  return 'Ask me anything...';
}
