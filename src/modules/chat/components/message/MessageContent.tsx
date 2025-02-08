import { CopyButton } from '@/components/CopyButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, parseBackendUTCDate } from '@/lib/utils';
import { MarkdownRenderer } from '@/modules/chat/components/markdown/MarkdownRenderer';
import { MessageContentProps } from '@/types/message';
import { format } from 'date-fns';
import { AlertCircle, Coins, Pencil } from 'lucide-react';

function StatusIndicator() {
  const dots = 3;

  return (
    <div className="flex h-2 items-center gap-[3px]" aria-label="Generating response">
      {[...Array(dots)].map((_, i) => (
        <div
          key={i}
          className="h-1 w-1 rounded-full bg-primary/60"
          style={{
            animation: 'fade 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export function MessageContent({ message, isStreaming, role, onEditClick, isEditing }: MessageContentProps) {
  const messageCreateDate = parseBackendUTCDate(message.created_at);
  return (
    <div className="space-y-1.5">
      {/* Message content */}
      <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:my-0 max-w-none break-words">
        {role === 'user' ? (
          // For user messages, just render the content directly
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          // For AI messages, use markdown renderer
          <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-xs">
        {/* Left side metadata */}
        <div className="flex items-center gap-2">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <time
                dateTime={message.created_at}
                className="tabular-nums text-muted-foreground transition-colors hover:text-foreground"
              >
                {format(messageCreateDate, 'h:mm a')}
              </time>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {format(messageCreateDate, 'MMMM d, yyyy h:mm a')}
            </TooltipContent>
          </Tooltip>

          {/* Usage info - Only for assistant messages */}
          {role === 'assistant' && message.usage && (
            <>
              <span className="inline-block h-0.5 w-0.5 rounded-full bg-current opacity-40" />
              <Tooltip delayDuration={200}>
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
              <Tooltip delayDuration={200}>
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

        {/* Right side - Actions and Status */}
        <div className="flex items-center gap-3">
          {isStreaming && <StatusIndicator />}

          {message.status === 'failed' && (
            <TooltipProvider delayDuration={200} skipDelayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-destructive/90 transition-colors hover:text-destructive">
                    <AlertCircle className="h-2.5 w-2.5" />
                    <span className="font-medium">Error</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">{message.error_message}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Edit button */}
            {role === 'user' && onEditClick && !isStreaming && (
              <TooltipProvider delayDuration={200} skipDelayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onEditClick(message.id)}
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      disabled={isEditing}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit message</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Edit message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Copy button */}
            {!isStreaming && (
              <CopyButton
                text={message.content}
                className={cn(
                  'p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100',
                  isEditing && 'pointer-events-none opacity-50'
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
