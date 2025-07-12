import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ProgressiveToolArgs, StreamBlock } from '@/types/stream';
import { ChevronDown, Settings, Terminal } from 'lucide-react';
import { memo, useState } from 'react';
import { groupToolsByName } from './MessageUtils';

interface ToolGroupProps {
  toolBlocks: StreamBlock[]; // Only contains tool_start, tool_call, tool_result (no thinking)
  isOpen: boolean;
  onToggle: () => void;
  progressive_tool_args?: Map<string, ProgressiveToolArgs>;
  isStreaming?: boolean;
}

const ToolGroup = memo(function ToolGroup({
  toolBlocks,
  isOpen,
  onToggle,
  progressive_tool_args,
  isStreaming = false,
}: ToolGroupProps) {
  const toolsByName = groupToolsByName(toolBlocks);
  const toolNames = Object.keys(toolsByName);
  const toolCount = toolNames.length;

  // State for individual tool collapsibility
  const [openTools, setOpenTools] = useState<Set<string>>(new Set());

  const toggleTool = (toolName: string) => {
    setOpenTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolName)) {
        newSet.delete(toolName);
      } else {
        newSet.add(toolName);
      }
      return newSet;
    });
  };

  // Determine overall status
  const hasAnyResults = toolBlocks.some((block) => block.type === 'tool_result');
  const hasAnyInProgress = toolBlocks.some(
    (block) =>
      block.type === 'tool_call' && !toolBlocks.some((r) => r.type === 'tool_result' && r.tool_name === block.tool_name)
  );

  const groupStatus = hasAnyResults ? 'completed' : hasAnyInProgress ? 'executing' : 'starting';

  // Create group title and status
  const groupTitle = toolCount === 1 ? toolNames[0] || 'Tool' : `${toolCount} tools`;
  const statusText = groupStatus;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="bg-muted/20 rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/30 flex w-full items-center gap-3 p-4 text-left transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
          <Settings className="h-4 w-4 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{groupTitle}</div>
          <div className="text-muted-foreground text-xs">
            {statusText}
            {isStreaming && groupStatus !== 'completed' && '...'}
            {' • Click to view details'}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-3">
          {/* Render tool blocks */}
          {Object.entries(toolsByName).map(([toolName, blocks], index) => {
            const toolCallId = blocks.find((block) => block.type === 'tool_call')?.tool_call_id;
            const hasResults = blocks.some((block) => block.type === 'tool_result');
            const hasArgs = blocks.some((block) => block.type === 'tool_call' && block.tool_args);

            // Create progressive content
            const createProgressiveContent = () => {
              if (!toolCallId || !progressive_tool_args) return null;

              const progressiveArgs = progressive_tool_args.get(toolCallId);
              if (!progressiveArgs || typeof progressiveArgs === 'string') return null;
              if (!progressiveArgs.accumulated_args || progressiveArgs.is_complete) return null;

              return (
                <div>
                  <div className="text-muted-foreground mb-2 text-xs font-medium">
                    Building Arguments{progressiveArgs.is_valid_json ? ' ✓' : ' ⏳'}
                  </div>
                  <div className="bg-muted/30 rounded-md p-3">
                    <pre className="font-mono text-xs whitespace-pre-wrap text-amber-600 dark:text-amber-400">
                      {progressiveArgs.accumulated_args}
                      <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current" />
                    </pre>
                  </div>
                </div>
              );
            };

            const isToolOpen = openTools.has(toolName);

            return (
              <Collapsible
                key={`${toolName}-${index}`}
                open={isToolOpen}
                onOpenChange={() => toggleTool(toolName)}
                className="rounded-md border"
              >
                <CollapsibleTrigger className="hover:bg-muted/30 flex w-full items-center gap-3 p-3 text-left transition-colors">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10">
                    <Terminal className="h-3 w-3 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{toolName}</div>
                    <div className="text-muted-foreground text-xs">
                      {hasResults ? 'completed' : hasArgs ? 'executing' : 'starting'} • Click to view details
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200',
                      isToolOpen && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <div className="space-y-3">
                    {createProgressiveContent()}

                    {hasArgs && (
                      <div>
                        <div className="text-muted-foreground mb-2 text-xs font-medium">Arguments</div>
                        <div className="bg-muted/30 rounded-md p-3">
                          {blocks
                            .filter((block) => block.type === 'tool_call' && block.tool_args)
                            .map((block, argIndex) => (
                              <pre key={argIndex} className="font-mono text-xs whitespace-pre-wrap">
                                {JSON.stringify(block.tool_args, null, 2)}
                              </pre>
                            ))}
                        </div>
                      </div>
                    )}

                    {hasResults && (
                      <div>
                        <div className="text-muted-foreground mb-2 text-xs font-medium">Results</div>
                        <div className="bg-muted/30 rounded-md p-3">
                          {blocks
                            .filter((block) => block.type === 'tool_result')
                            .map((block, resultIndex) => (
                              <div key={resultIndex} className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                {Array.isArray(block.tool_result) ? (
                                  block.tool_result
                                    .filter((item) => item.type === 'text')
                                    .map((item, textIndex) => (
                                      <div key={textIndex}>{(item as { type: 'text'; text: string }).text}</div>
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
      </CollapsibleContent>
    </Collapsible>
  );
});

export default ToolGroup;
