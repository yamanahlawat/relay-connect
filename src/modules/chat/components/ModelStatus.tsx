interface ModelStatusProps {
  provider?: { name: string };
  model?: { name: string };
}

export function ModelStatus({ provider, model }: ModelStatusProps) {
  if (!provider || !model) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
        </span>
        <span className="font-medium text-yellow-700 dark:text-yellow-400">
          Select a provider and model to get started
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
      <div className="flex items-center gap-1.5">
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Using <span className="font-medium text-green-700 dark:text-green-300">{model.name}</span> by{' '}
        <span className="font-medium text-green-700 dark:text-green-300">{provider.name}</span>
      </div>
    </div>
  );
}
