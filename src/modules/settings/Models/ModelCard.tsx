import { Button } from '@/components/ui/button';
import { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';
import { Bot, Code2, Cpu, Settings2, Trash } from 'lucide-react';

type Model = components['schemas']['ModelRead'];

const modelIcons = {
  completion: Bot,
  code: Code2,
  embedding: Cpu,
} as const;

interface ModelCardProps {
  model: Model;
  onEdit: (model: Model) => void;
  onDelete: (model: Model) => void;
}

export function ModelCard({ model, onEdit, onDelete }: ModelCardProps) {
  const Icon = modelIcons.completion;

  return (
    <div className="group flex items-center justify-between rounded-lg border bg-card/50 p-4 transition-all hover:bg-accent/5">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            model.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h4 className="font-medium">{model.name}</h4>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{model.max_tokens.toLocaleString()} tokens</span>
            <span className="inline-block h-1 w-1 rounded-full bg-border" />
            <span>Temperature: {model.temperature}</span>
          </div>
        </div>

        {/* Status Badge */}
        {!model.is_active && (
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
          onClick={() => onEdit(model)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onDelete(model)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
