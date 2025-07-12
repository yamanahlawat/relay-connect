import JsonCodeBlock from '@/components/JsonCodeBlock';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/modules/chat/components/markdown/MarkdownRenderer';
import type { ContentItem, ProgressiveToolArgs, StreamBlockType, TextContent } from '@/types/stream';
import { ChevronDown, Terminal } from 'lucide-react';
import { useState } from 'react';

interface ToolBlockProps {
  type: StreamBlockType;
  tool_name: string | null;
  tool_args?: Record<string, unknown> | null;
  tool_result?: string | ContentItem[] | null;
  is_streaming?: boolean;
  is_error?: boolean;
  error_message?: string | null;
  next_block_type?: StreamBlockType;
  on_collapse?: (is_open: boolean) => void;
  progressive_args?: ProgressiveToolArgs | null;
}

export default function ToolBlock({
  type,
  tool_name,
  tool_args,
  tool_result,
  is_streaming,
  is_error,
  error_message,
  next_block_type,
  on_collapse,
  progressive_args,
}: ToolBlockProps) {
  const [is_open, setIsOpen] = useState(false);

  const handleCollapseChange = (open: boolean) => {
    setIsOpen(open);
    on_collapse?.(open);
  };

  // Determine if this block should show streaming state
  const is_block_streaming = is_streaming && !next_block_type;

  // Convert tool_result to ContentItem[] if it's just a string
  const result_as_content_items: ContentItem[] = Array.isArray(tool_result)
    ? tool_result
    : typeof tool_result === 'string'
      ? [{ type: 'text', text: tool_result }]
      : [];

  // Determine if we have meaningful content to show
  const hasRequest = tool_args || progressive_args?.accumulated_args;
  const hasResponse = result_as_content_items.length > 0;

  // Don't render if no meaningful data
  if (!hasRequest && !hasResponse && !is_error) return null;

  // Determine status for better UX
  const isCompleted = type === 'tool_result' && !is_error;
  const isExecuting = type === 'tool_call' || (type === 'tool_result' && is_block_streaming);

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        is_open && 'bg-muted/30 border-blue-500/30 ring-2 ring-blue-500/20',
        !is_open && 'hover:bg-muted/20'
      )}
    >
      <Collapsible open={is_open} onOpenChange={handleCollapseChange}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
              <Terminal className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-medium">{tool_name || 'Tool'}</div>
              <div className="text-muted-foreground flex items-center text-xs">
                {isCompleted ? 'completed' : isExecuting ? 'executing' : 'starting'}
                {is_block_streaming && '...'}
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn('text-muted-foreground h-4 w-4 transition-transform duration-200', is_open && 'rotate-180')}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 px-4 pb-4">
            {/* Request Section */}
            {hasRequest && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">Request</div>
                  <div className="bg-border h-px flex-1" />
                </div>
                <div className="bg-muted/40 max-h-60 overflow-y-auto rounded-lg border">
                  <div className="p-3">
                    {tool_args ? (
                      <JsonCodeBlock data={tool_args} />
                    ) : progressive_args?.accumulated_args ? (
                      <div className="space-y-2">
                        <div className="text-muted-foreground text-xs">Building arguments...</div>
                        <div className="font-mono text-sm whitespace-pre-wrap text-amber-600 dark:text-amber-400">
                          {progressive_args.accumulated_args}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Response Section */}
            {hasResponse && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">Response</div>
                  <div className="bg-border h-px flex-1" />
                </div>
                <div className="bg-muted/40 max-h-60 overflow-y-auto rounded-lg border">
                  <div className="p-3">
                    {result_as_content_items.length > 0 && (
                      <div className="space-y-2">
                        {result_as_content_items
                          .filter((item): item is TextContent => item.type === 'text')
                          .map((item, index) => (
                            <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                              <MarkdownRenderer content={item.text} isStreaming={false} />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Section */}
            {is_error && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-red-500">Error</div>
                  <div className="bg-border h-px flex-1" />
                </div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/10">
                  <div className="p-3">
                    <div className="text-red-500">
                      <p className="font-medium">Error executing tool</p>
                      {error_message && <p className="text-sm opacity-90">{error_message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
