import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ProgressiveToolArgs, StreamBlock } from '@/types/stream';
import { ChevronDown, Terminal } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

interface ToolGroupProps {
  toolBlocks: StreamBlock[];
  isStreaming?: boolean;
  progressive_tool_args?: Map<string, ProgressiveToolArgs>;
}

const ToolGroup = memo(function ToolGroup({ toolBlocks, isStreaming = false, progressive_tool_args }: ToolGroupProps) {
  // Group by tool_call_id to show individual tool calls
  const toolCalls = useMemo(() => {
    const groups: Record<string, StreamBlock[]> = {};
    toolBlocks.forEach((block) => {
      const toolCallId = block.tool_call_id || 'unknown';
      if (!groups[toolCallId]) groups[toolCallId] = [];
      groups[toolCallId].push(block);
    });
    return groups;
  }, [toolBlocks]);

  const [openTools, setOpenTools] = useState<Set<string>>(new Set());

  return (
    <div className="bg-muted/20 rounded-md border p-3">
      <div className="space-y-2">
        {Object.entries(toolCalls).map(([toolCallId, blocks]) => {
          const toolName = blocks[0]?.tool_name || 'Unknown Tool';
          const hasResults = blocks.some((block) => block.type === 'tool_result');
          const hasArgs =
            blocks.some((block) => block.type === 'tool_call' && block.tool_args) ||
            (progressive_tool_args && progressive_tool_args.has(toolCallId));
          const isOpen = openTools.has(toolCallId);

          const status = hasResults ? 'completed' : hasArgs ? 'executing' : 'starting';

          return (
            <Collapsible
              key={toolCallId}
              open={isOpen}
              onOpenChange={(open) => {
                if (open) {
                  setOpenTools((prev) => new Set(prev).add(toolCallId));
                } else {
                  setOpenTools((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(toolCallId);
                    return newSet;
                  });
                }
              }}
              className="bg-background rounded-md border"
            >
              <CollapsibleTrigger className="hover:bg-muted/30 flex w-full items-center gap-3 p-3 text-left transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                  <Terminal className="h-3 w-3 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{toolName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground text-xs">
                    {status}
                    {isStreaming && !hasResults && '...'}
                  </div>
                  <ChevronDown
                    className={cn(
                      'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-3">
                  {hasArgs && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="text-sm font-medium">Request</div>
                        <div className="bg-border h-px flex-1" />
                      </div>
                      <div className="bg-muted/30 max-h-60 overflow-y-auto rounded-md p-3">
                        {/* Show final tool_args if available (from completed stream blocks) */}
                        {blocks.some((b) => b.type === 'tool_call' && b.tool_args)
                          ? blocks
                              .filter((block) => block.type === 'tool_call' && block.tool_args)
                              .map((block, i) => (
                                <pre key={i} className="font-mono text-xs whitespace-pre-wrap">
                                  {JSON.stringify(block.tool_args, null, 2)}
                                </pre>
                              ))
                          : /* Show progressive args during streaming if no final args available */
                            isStreaming &&
                            progressive_tool_args &&
                            progressive_tool_args.has(toolCallId) && (
                              <div className="space-y-2">
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                  <div className="h-1 w-1 animate-pulse rounded-full bg-current" />
                                  Building arguments...
                                </div>
                                <pre className="font-mono text-xs whitespace-pre-wrap text-amber-600 dark:text-amber-400">
                                  {progressive_tool_args.get(toolCallId)?.accumulated_args}
                                </pre>
                              </div>
                            )}
                      </div>
                    </div>
                  )}

                  {hasResults && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="text-sm font-medium">Response</div>
                        <div className="bg-border h-px flex-1" />
                      </div>
                      <div className="bg-muted/30 max-h-60 overflow-y-auto rounded-md p-3">
                        {blocks
                          .filter((block) => block.type === 'tool_result')
                          .map((block, i) => (
                            <div key={i} className="prose prose-sm dark:prose-invert max-w-none text-sm">
                              {Array.isArray(block.tool_result) ? (
                                block.tool_result
                                  .filter((item) => item.type === 'text')
                                  .map((item, j) => (
                                    <div key={j}>{item.type === 'text' ? item.text : String(item)}</div>
                                  ))
                              ) : (
                                <div>{String(block.tool_result || '')}</div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
});

export default ToolGroup;
