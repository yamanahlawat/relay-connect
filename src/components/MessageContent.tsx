import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageContentProps } from '@/types/chat';
import { format } from 'date-fns';
import { AlertCircle, Coins, Loader2 } from 'lucide-react';

export function MessageContent({
  message,
  isStreaming,
  role,
}: MessageContentProps & { isStreaming?: boolean; role: 'user' | 'assistant' }) {
  return (
    <div className="space-y-1.5">
      {/* Message content */}
      <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:my-0 max-w-none break-words">
        {role === 'user' ? (
          // For user messages, just render the content directly
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          // For AI messages, use markdown renderer
          <MarkdownRenderer content={message.content} />
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-xs">
        {/* Left side metadata - Always visible with hover states */}
        <div className="flex items-center gap-2">
          {/* Timestamp */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <time
                dateTime={message.created_at}
                className="tabular-nums text-muted-foreground transition-colors hover:text-foreground"
              >
                {format(new Date(message.created_at), 'h:mm a')}
              </time>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {format(new Date(message.created_at), 'MMMM d, yyyy h:mm a')}
            </TooltipContent>
          </Tooltip>

          {/* Usage info - Only for assistant messages */}
          {role === 'assistant' && message.usage && (
            <>
              <span className="inline-block h-0.5 w-0.5 rounded-full bg-current opacity-40" />
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span className="tabular-nums text-muted-foreground transition-colors hover:text-foreground">
                    {message.usage.input_tokens + message.usage.output_tokens} tokens
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="space-y-1 text-xs">
                  <div>Input: {message.usage.input_tokens} tokens</div>
                  <div>Output: {message.usage.output_tokens} tokens</div>
                </TooltipContent>
              </Tooltip>

              <span className="inline-block h-0.5 w-0.5 rounded-full bg-current opacity-40" />
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                    <Coins className="h-2.5 w-2.5" />
                    <span className="tabular-nums">${message.usage.total_cost.toFixed(4)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Total cost for this message
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Right side - Status indicators */}
        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-1 text-primary animate-in fade-in-0">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              <span className="font-medium">Generating...</span>
            </div>
          )}

          {message.status === 'failed' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-destructive/90 transition-colors hover:text-destructive">
                  <AlertCircle className="h-2.5 w-2.5" />
                  <span className="font-medium">Error</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs text-destructive">
                {message.error_message}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
