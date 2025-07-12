import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { StreamBlock } from '@/types/stream';
import { CheckCircle2, ChevronDown, Globe, Loader2, Terminal } from 'lucide-react';
import { memo } from 'react';
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer';

interface ToolSectionProps {
  toolName: string;
  toolBlocks: StreamBlock[];
  isOpen: boolean;
  onToggle: () => void;
  status?: 'starting' | 'building' | 'executing' | 'completed';
  showSpinner?: boolean;
  progressiveContent?: React.ReactNode;
}

const ToolSection = memo(function ToolSection({
  toolName,
  toolBlocks,
  isOpen,
  onToggle,
  status = 'completed',
  showSpinner = false,
  progressiveContent,
}: ToolSectionProps) {
  const hasResults = toolBlocks.some((block) => block.type === 'tool_result');
  const hasArgs = toolBlocks.some((block) => block.type === 'tool_call' && block.tool_args);
  const hasContent = hasResults || hasArgs || progressiveContent;

  const statusText = {
    starting: 'Starting',
    building: 'Building arguments',
    executing: 'Executing',
    completed: 'Completed',
  }[status];

  const getIcon = () => {
    if (showSpinner) return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (toolName.includes('search') || toolName.includes('web')) return <Globe className="h-4 w-4 text-amber-500" />;
    return <Terminal className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="bg-muted/20 rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/30 flex w-full items-center gap-3 p-4 text-left transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">{getIcon()}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{toolName}</div>
          <div className="text-muted-foreground text-xs">
            {statusText}
            {showSpinner && '...'}
            {hasContent && ' • Click to view details'}
          </div>
        </div>
        {hasContent && (
          <ChevronDown
            className={cn(
              'text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </CollapsibleTrigger>
      {hasContent && (
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-3">
            {progressiveContent}

            {hasArgs && (
              <div>
                <div className="text-muted-foreground mb-2 text-xs font-medium">Arguments</div>
                <div className="bg-muted/30 rounded-md p-3">
                  {toolBlocks
                    .filter((block) => block.type === 'tool_call' && block.tool_args)
                    .map((block, index) => (
                      <pre key={index} className="font-mono text-xs whitespace-pre-wrap">
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
                  {toolBlocks
                    .filter((block) => block.type === 'tool_result')
                    .map((block, index) => (
                      <div key={index} className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <MarkdownRenderer
                          content={
                            Array.isArray(block.tool_result)
                              ? block.tool_result
                                  .filter((item) => item.type === 'text')
                                  .map((item) => (item as { type: 'text'; text: string }).text)
                                  .join('\n\n')
                              : String(block.tool_result || '')
                          }
                          isStreaming={false}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
});

export default ToolSection;
