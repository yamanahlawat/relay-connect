'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertCircle, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageContentProps {
  message: {
    content: string;
    created_at: string;
    status?: string;
    error_message?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_cost: number;
    };
  };
}

export function MessageContent({ message, isStreaming }: MessageContentProps & { isStreaming?: boolean }) {
  return (
    <div className={cn('space-y-2 transition-opacity duration-200', isStreaming && 'animate-in fade-in-0')}>
      <div className="prose prose-sm dark:prose-invert max-w-none break-words">
        <MarkdownRenderer content={message.content} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
        <time dateTime={message.created_at} className="tabular-nums">
          {format(new Date(message.created_at), 'h:mm a')}
        </time>

        {isStreaming && (
          <div className="flex items-center gap-1.5 text-primary/80">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Generating...</span>
          </div>
        )}

        {message.status === 'failed' && (
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{message.error_message}</span>
          </div>
        )}

        {message.usage && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <div className="flex items-center gap-1">
              <span className="tabular-nums">{message.usage.input_tokens + message.usage.output_tokens} tokens</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="tabular-nums">${message.usage.total_cost.toFixed(4)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
