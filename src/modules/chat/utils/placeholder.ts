interface Provider {
  id: string;
}

interface Model {
  id: string;
}

export function getInputPlaceholder(
  selectedProvider: Provider | null,
  selectedModel: Model | null,
  streamingMessageId: string | null
): string {
  if (!selectedProvider || !selectedModel) return 'Select a provider and model to start...';
  if (streamingMessageId) return 'Please wait for the response...';
  return 'Type your message...';
}
