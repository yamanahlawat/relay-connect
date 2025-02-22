import JsonCodeBlock from '@/components/JsonCodeBlock';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/modules/chat/components/markdown/MarkdownRenderer';
import type { ContentItem, StreamBlockType } from '@/types/stream';
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Terminal } from 'lucide-react';
import { useState } from 'react';
import StreamingIndicator from './StreamingIndicator';

type ToolBlockType = Extract<StreamBlockType, 'tool_start' | 'tool_call' | 'tool_result'>;

interface ToolBlockProps {
  type: ToolBlockType;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_result?: string | ContentItem[];
  is_streaming?: boolean;
  is_error?: boolean;
  error_message?: string;
  next_block_type?: ToolBlockType;
  on_collapse?: (is_open: boolean) => void;
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
}: ToolBlockProps) {
  const [is_open, setIsOpen] = useState(false);

  const handleCollapseChange = (open: boolean) => {
    setIsOpen(open);
    on_collapse?.(open);
  };

  // Determine if this block should show streaming state
  const isBlockStreaming = is_streaming && !next_block_type;

  // Convert tool_result to ContentItem[] if it's just a string
  const resultAsContentItems: ContentItem[] = Array.isArray(tool_result)
    ? tool_result
    : typeof tool_result === 'string'
      ? [{ type: 'text', text: tool_result }]
      : [];

  const getTypeMetadata = (): TypeMetadata => {
    const baseMetadata = {
      iconClasses: is_streaming ? 'animate-spin' : '',
    };

    switch (type) {
      case 'tool_start':
        return {
          ...baseMetadata,
          icon: isBlockStreaming ? Loader2 : Terminal,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
        };

      case 'tool_call':
        return {
          ...baseMetadata,
          icon: isBlockStreaming ? Loader2 : Terminal,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
        };

      case 'tool_result':
        return {
          ...baseMetadata,
          icon: is_error ? AlertCircle : isBlockStreaming ? Loader2 : CheckCircle2,
          iconColor: is_error ? 'text-red-500' : isBlockStreaming ? 'text-blue-500' : 'text-green-500',
          bgColor: is_error ? 'bg-red-500/10' : isBlockStreaming ? 'bg-blue-500/10' : 'bg-green-500/10',
        };

      default:
        return {
          icon: Terminal,
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
          iconClasses: '',
        };
    }
  };

  const { icon: Icon, iconColor, bgColor, iconClasses } = getTypeMetadata();

  const getDisplayTitle = () => {
    switch (type) {
      case 'tool_start':
        return `Starting ${tool_name}...`;
      case 'tool_call':
        return `Executing ${tool_name}`;
      case 'tool_result':
        return `Results from ${tool_name}`;
      default:
        return tool_name || 'Tool Execution';
    }
  };

  const displayTitle = getDisplayTitle();

  // If this block is streaming, show a spinner next to the text
  const toolNameOrIndicator = isBlockStreaming ? (
    <StreamingIndicator type="thinking" text={displayTitle} className="ml-2" />
  ) : (
    <span className="font-medium">{displayTitle}</span>
  );

  // Determine if there's extra detail to show in the collapsible
  // e.g. 'tool_call' with arguments, or 'tool_result' with some text or an error
  const hasExtraDetail =
    (type === 'tool_call' && tool_args) || (type === 'tool_result' && (resultAsContentItems.length > 0 || is_error));

  // Renders the content in the collapsible body
  const renderContent = () => {
    if (is_error) {
      return (
        <div className="text-red-500">
          <p className="font-medium">Error executing tool</p>
          <p className="text-sm opacity-90">{error_message}</p>
        </div>
      );
    }

    if (type === 'tool_call' && tool_args) {
      // Show arguments as JSON
      return (
        <div className="rounded-md font-mono text-sm">
          <div className="mb-1 text-xs text-muted-foreground">Arguments:</div>
          <JsonCodeBlock data={tool_args} />
        </div>
      );
    }

    if (type === 'tool_result') {
      // If there's multiple items, you could merge them into one string if you prefer:
      const mergedText = resultAsContentItems.map((item) => item.text).join('\n\n');
      return (
        <div className="space-y-4">
          <div className="max-w-full break-words">
            <div className="prose prose-sm dark:prose-invert prose-pre:whitespace-pre-wrap max-w-none">
              <MarkdownRenderer content={mergedText} isStreaming={is_streaming} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Collapsible open={is_open} onOpenChange={handleCollapseChange}>
      <div className="relative pl-5">
        {/* Vertical line for styling */}
        <div className="absolute left-2 top-0 h-full w-px bg-border" />

        {/* If there's no detail, we skip the collapsible trigger and just show an inline row */}
        {!hasExtraDetail ? (
          <div className="flex items-center gap-2 py-1 text-sm">
            <div className={cn('flex h-4 w-4 items-center justify-center rounded-full', bgColor)}>
              {is_streaming ? (
                <Loader2 className={cn('h-3 w-3', iconColor, 'animate-spin')} />
              ) : (
                <Icon className={cn('h-3 w-3', iconColor, iconClasses)} />
              )}
            </div>
            {toolNameOrIndicator}
          </div>
        ) : (
          <>
            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md py-1 text-sm hover:text-foreground">
              <div className={cn('flex h-4 w-4 items-center justify-center rounded-full', bgColor)}>
                {is_streaming ? (
                  <Loader2 className={cn('h-3 w-3', iconColor, 'animate-spin')} />
                ) : (
                  <Icon className={cn('h-3 w-3', iconColor, iconClasses)} />
                )}
              </div>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform duration-200', !is_open && '-rotate-90')}
              />
              {toolNameOrIndicator}
            </CollapsibleTrigger>

            <CollapsibleContent className="pb-4 pt-2">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Tool Execution Details</h4>
                <div
                  className={cn(
                    'overflow-x-auto rounded-lg border bg-muted/20 p-4',
                    'text-sm leading-relaxed text-muted-foreground/90',
                    is_error && 'border-red-500/30 bg-red-500/5'
                  )}
                >
                  {renderContent()}
                </div>
              </div>
            </CollapsibleContent>
          </>
        )}
      </div>
    </Collapsible>
  );
}

interface TypeMetadata {
  icon: typeof Terminal | typeof Loader2 | typeof CheckCircle2 | typeof AlertCircle;
  iconColor: string;
  bgColor: string;
  iconClasses: string;
}
