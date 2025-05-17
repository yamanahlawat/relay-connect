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
    <div className="group bg-card hover:bg-muted/30 flex items-center justify-between rounded-md border p-3 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border',
            model.is_active ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Info */}
        <div>
          <h4 className="text-sm font-medium">{model.name}</h4>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
            <span>{model.max_tokens.toLocaleString()} tokens</span>
            <span className="bg-border inline-block h-1 w-1 rounded-full" />
            <span>Temperature: {model.temperature}</span>
          </div>
        </div>

        {/* Status Badge */}
        {!model.is_active && (
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
          onClick={() => onEdit(model)}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-background hover:text-foreground h-7 w-7 p-0"
          onClick={() => onDelete(model)}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
