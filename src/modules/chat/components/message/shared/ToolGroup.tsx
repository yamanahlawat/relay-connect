import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ProgressiveToolArgs, StreamBlock } from '@/types/stream';
import { ChevronDown } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

interface ToolGroupProps {
  toolBlocks: StreamBlock[];
  isStreaming?: boolean;
  progressive_tool_args?: Map<string, ProgressiveToolArgs>;
}

interface ToolCallData {
  toolCallId: string;
  blocks: StreamBlock[];
  toolName: string;
  hasResults: boolean;
  hasArgs: boolean;
  status: 'completed' | 'executing' | 'starting';
}

// Extracted components for better organization
const TimelineDot = memo<{ status: ToolCallData['status'] }>(({ status }) => {
  const borderColor =
    status === 'completed'
      ? 'border-emerald-500'
      : status === 'executing'
        ? 'border-blue-500'
        : 'border-muted-foreground';

  const bgColor =
    status === 'completed' ? 'bg-emerald-500' : status === 'executing' ? 'bg-blue-500' : 'bg-muted-foreground';

  return (
    <div className={cn('bg-background flex h-2.5 w-2.5 items-center justify-center rounded-full border', borderColor)}>
      <div className={cn('h-1 w-1 rounded-full', bgColor)} />
    </div>
  );
});
TimelineDot.displayName = 'TimelineDot';

const ToolArguments = memo<{
  blocks: StreamBlock[];
  isStreaming: boolean;
  progressiveArgs?: ProgressiveToolArgs;
}>(({ blocks, isStreaming, progressiveArgs }) => {
  const hasToolArgs = blocks.some((b) => b.type === 'tool_call' && b.tool_args);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="text-sm font-medium">Request</div>
        <div className="bg-border h-px flex-1" />
      </div>
      <div className="bg-muted/30 max-h-60 overflow-y-auto rounded-md p-3">
        {hasToolArgs
          ? blocks
              .filter((block) => block.type === 'tool_call' && block.tool_args)
              .map((block, i) => (
                <pre key={i} className="font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(block.tool_args, null, 2)}
                </pre>
              ))
          : isStreaming &&
            progressiveArgs && (
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-current" />
                  Building arguments...
                </div>
                <pre className="font-mono text-xs whitespace-pre-wrap text-amber-600 dark:text-amber-400">
                  {progressiveArgs.accumulated_args}
                </pre>
              </div>
            )}
      </div>
    </div>
  );
});
ToolArguments.displayName = 'ToolArguments';

const ToolResults = memo<{ blocks: StreamBlock[] }>(({ blocks }) => {
  const resultBlocks = blocks.filter((block) => block.type === 'tool_result');

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="text-sm font-medium">Response</div>
        <div className="bg-border h-px flex-1" />
      </div>
      <div className="bg-muted/30 max-h-60 overflow-y-auto rounded-md p-3">
        {resultBlocks.map((block, i) => (
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
  );
});
ToolResults.displayName = 'ToolResults';

const ToolGroup = memo<ToolGroupProps>(function ToolGroup({ toolBlocks, isStreaming = false, progressive_tool_args }) {
  const [openTools, setOpenTools] = useState<Set<string>>(new Set());

  const toolCallsData = useMemo<ToolCallData[]>(() => {
    const groups: Record<string, StreamBlock[]> = {};

    // Group blocks by tool_call_id
    for (const block of toolBlocks) {
      const toolCallId = block.tool_call_id || 'unknown';
      (groups[toolCallId] ||= []).push(block);
    }

    // Transform to ToolCallData array
    return Object.entries(groups).map(([toolCallId, blocks]) => {
      const hasResults = blocks.some((b) => b.type === 'tool_result');
      const hasArgs =
        blocks.some((b) => b.type === 'tool_call' && b.tool_args) || (progressive_tool_args?.has(toolCallId) ?? false);

      return {
        toolCallId,
        blocks,
        toolName: blocks[0]?.tool_name || 'Unknown Tool',
        hasResults,
        hasArgs,
        status: hasResults ? 'completed' : hasArgs ? 'executing' : 'starting',
      };
    });
  }, [toolBlocks, progressive_tool_args]);

  const toggleTool = useCallback((toolCallId: string, open: boolean) => {
    setOpenTools((prev) => {
      const newSet = new Set(prev);
      if (open) {
        newSet.add(toolCallId);
      } else {
        newSet.delete(toolCallId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="bg-muted/20 rounded-md border px-3 py-2">
      <div className="relative">
        {toolCallsData.map((toolData, index) => {
          const isOpen = openTools.has(toolData.toolCallId);
          const isLast = index === toolCallsData.length - 1;
          const progressiveArgs = progressive_tool_args?.get(toolData.toolCallId);

          return (
            <div key={toolData.toolCallId} className="relative">
              {/* Timeline wrapper */}
              <div className="flex">
                {/* Timeline column */}
                <div className="relative flex flex-col items-center">
                  {/* Dot */}
                  <div className="mt-1.5 py-2">
                    <TimelineDot status={toolData.status} />
                  </div>
                  {/* Line - stretches naturally with content */}
                  {!isLast && <div className="bg-border w-px flex-1" />}
                </div>

                {/* Content column */}
                <div className={cn('ml-4 flex-1', isOpen && 'pb-3', !isLast && !isOpen && 'pb-2')}>
                  <Collapsible open={isOpen} onOpenChange={(open) => toggleTool(toolData.toolCallId, open)}>
                    <CollapsibleTrigger className="group flex w-full items-center justify-between py-2 text-left transition-opacity hover:opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{toolData.toolName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground text-xs">
                          {toolData.status}
                          {isStreaming && !toolData.hasResults && '...'}
                        </div>
                        <ChevronDown
                          className={cn(
                            'text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-2">
                      <div className="space-y-3">
                        {toolData.hasArgs && (
                          <ToolArguments
                            blocks={toolData.blocks}
                            isStreaming={isStreaming}
                            progressiveArgs={progressiveArgs}
                          />
                        )}
                        {toolData.hasResults && <ToolResults blocks={toolData.blocks} />}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ToolGroup;
