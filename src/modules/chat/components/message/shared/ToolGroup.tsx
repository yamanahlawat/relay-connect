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
  // Simple: group by tool name
  const toolsByName = useMemo(() => {
    const groups: Record<string, StreamBlock[]> = {};
    toolBlocks.forEach((block) => {
      const toolName = block.tool_name || 'Unknown Tool';
      if (!groups[toolName]) groups[toolName] = [];
      groups[toolName].push(block);
    });
    return groups;
  }, [toolBlocks]);

  const [openTools, setOpenTools] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-2">
      {Object.entries(toolsByName).map(([toolName, blocks]) => {
        const hasResults = blocks.some((block) => block.type === 'tool_result');
        const hasArgs =
          blocks.some((block) => block.type === 'tool_call' && block.tool_args) ||
          (progressive_tool_args &&
            Array.from(progressive_tool_args.values()).some((args) => args.tool_name === toolName));
        const isOpen = openTools.has(toolName);

        return (
          <Collapsible
            key={toolName}
            open={isOpen}
            onOpenChange={(open) => {
              if (open) {
                setOpenTools((prev) => new Set(prev).add(toolName));
              } else {
                setOpenTools((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(toolName);
                  return newSet;
                });
              }
            }}
            className="rounded-md border"
          >
            <CollapsibleTrigger className="hover:bg-muted/30 flex w-full items-center gap-3 p-3 text-left transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                <Terminal className="h-3 w-3 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{toolName}</div>
                <div className="text-muted-foreground text-xs">
                  {hasResults ? 'completed' : hasArgs ? 'executing' : 'starting'}
                  {isStreaming && !hasResults && '...'}
                </div>
              </div>
              <ChevronDown
                className={cn('text-muted-foreground h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
              />
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
                      {/* Always show final tool_args if available (from completed stream blocks) */}
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
                          Array.from(progressive_tool_args.values())
                            .filter((args) => args.tool_name === toolName || !args.tool_name)
                            .map((args, i) => (
                              <div key={i} className="space-y-2">
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                  <div className="h-1 w-1 animate-pulse rounded-full bg-current" />
                                  Building arguments...
                                </div>
                                <pre className="font-mono text-xs whitespace-pre-wrap text-amber-600 dark:text-amber-400">
                                  {args.accumulated_args}
                                </pre>
                              </div>
                            ))}
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
                                .map((item, j) => <div key={j}>{item.type === 'text' ? item.text : String(item)}</div>)
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
  );
});

export default ToolGroup;
