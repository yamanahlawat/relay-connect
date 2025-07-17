import { Button } from '@/components/ui/button';
import { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';
import { Bot, Cloud, Globe, Settings2, Terminal, Trash } from 'lucide-react';

type Provider = components['schemas']['ProviderRead'];

const providerIcons = {
  anthropic: Bot,
  openai: Cloud,
  ollama: Terminal,
  custom: Globe,
  gemini: Bot,
  groq: Cloud,
  mistral: Cloud,
  cohere: Cloud,
  bedrock: Cloud,
} as const;

interface ProviderCardProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export function ProviderCard({ provider, onEdit, onDelete }: ProviderCardProps) {
  const Icon = providerIcons[provider.type];

  return (
    <div className="group bg-card hover:bg-muted/30 flex items-center justify-between rounded-md border p-3 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border',
            provider.is_active ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Info */}
        <div>
          <h4 className="text-sm font-medium">{provider.name}</h4>
        </div>

        {/* Status Badge */}
        {!provider.is_active && (
          <span className="ml-2 rounded-full bg-yellow-100/50 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            Inactive
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex opacity-80 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-background hover:text-foreground h-7 w-7 p-0"
          onClick={() => onEdit(provider)}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-background hover:text-foreground h-7 w-7 p-0"
          onClick={() => onDelete(provider)}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
