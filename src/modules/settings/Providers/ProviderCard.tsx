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
} as const;

interface ProviderCardProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export function ProviderCard({ provider, onEdit, onDelete }: ProviderCardProps) {
  const Icon = providerIcons[provider.type];

  return (
    <div className="group flex items-center justify-between rounded-lg border bg-card/50 p-4 transition-all hover:bg-accent/5">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            provider.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Info */}
        <div>
          <h4 className="font-medium">{provider.name}</h4>
        </div>

        {/* Status Badge */}
        {!provider.is_active && (
          <span className="ml-3 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
            Inactive
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(provider)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onDelete(provider)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
