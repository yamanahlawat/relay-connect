import { cn } from '@/lib/utils';
import { Brain, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

interface ThinkingBlockProps {
  content: string;
  is_streaming?: boolean;
  className?: string;
}

export default function ThinkingBlock({ content, is_streaming = false, className }: ThinkingBlockProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <div className={cn('bg-muted/30 flex items-start gap-3 rounded-lg p-4', className)}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
        {is_streaming ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : (
          <Brain className="h-4 w-4 text-blue-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground mb-1 text-sm font-medium">
          {is_streaming ? 'Thinking...' : 'Thought Process'}
        </div>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none text-sm">
          <MarkdownRenderer content={content} isStreaming={is_streaming} />
        </div>
      </div>
    </div>
  );
}
