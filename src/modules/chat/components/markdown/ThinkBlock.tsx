import { cn } from '@/lib/utils';
import { Brain, Loader2, Terminal } from 'lucide-react';

interface ThinkBlockProps {
  type?: 'reasoning' | 'tool';
  title?: string;
  children?: React.ReactNode;
  isStreaming?: boolean;
}

export default function ThinkBlock({ type = 'reasoning', title, children, isStreaming = false }: ThinkBlockProps) {
  const getTypeMetadata = () => {
    switch (type) {
      case 'tool':
        return {
          icon: Terminal,
          defaultTitle: 'Tool Process',
          iconColor: 'text-blue-500',
        };
      case 'reasoning':
      default:
        return {
          icon: isStreaming ? Loader2 : Brain,
          defaultTitle: 'Thought Process',
          iconColor: 'text-primary',
        };
    }
  };

  const { icon: Icon, defaultTitle, iconColor } = getTypeMetadata();

  return (
    <div className="mb-3 mt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn('h-4 w-4', iconColor, isStreaming && 'animate-spin')} />
        <span className="font-medium">
          {title || defaultTitle}
          {isStreaming && '...'}
        </span>
      </div>

      {children && (
        <div className="mt-2 rounded-lg border bg-muted/20 px-4 py-3">
          <div className="prose-sm dark:prose-invert text-sm text-muted-foreground/90">{children}</div>
        </div>
      )}
    </div>
  );
}
