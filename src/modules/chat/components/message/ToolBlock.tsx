import JsonCodeBlock from '@/components/JsonCodeBlock';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/modules/chat/components/markdown/MarkdownRenderer';
import type { ContentItem, StreamBlockType, TextContent } from '@/types/stream';
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Terminal } from 'lucide-react';
import { useState } from 'react';
import StreamingIndicator from './StreamingIndicator';

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
  const is_block_streaming = is_streaming && !next_block_type;

  // Convert tool_result to ContentItem[] if it's just a string
  const result_as_content_items: ContentItem[] = Array.isArray(tool_result)
    ? tool_result
    : typeof tool_result === 'string'
      ? [{ type: 'text', text: tool_result }]
      : [];

  const get_type_metadata = (): TypeMetadata => {
    const base_metadata = {
      icon_classes: is_streaming ? 'animate-spin' : '',
    };

    switch (type) {
      case 'tool_start':
        return {
          ...base_metadata,
          icon: is_block_streaming ? Loader2 : Terminal,
          icon_color: 'text-blue-500',
          bg_color: 'bg-blue-500/10',
        };

      case 'tool_call':
        return {
          ...base_metadata,
          icon: is_block_streaming ? Loader2 : Terminal,
          icon_color: 'text-amber-500',
          bg_color: 'bg-amber-500/10',
        };

      case 'tool_result':
        return {
          ...base_metadata,
          icon: is_error ? AlertCircle : is_block_streaming ? Loader2 : CheckCircle2,
          icon_color: is_error ? 'text-red-500' : is_block_streaming ? 'text-blue-500' : 'text-green-500',
          bg_color: is_error ? 'bg-red-500/10' : is_block_streaming ? 'bg-blue-500/10' : 'bg-green-500/10',
        };

      default:
        return {
          icon: Terminal,
          icon_color: 'text-primary',
          bg_color: 'bg-primary/10',
          icon_classes: '',
        };
    }
  };

  const { icon: Icon, icon_color, bg_color, icon_classes } = get_type_metadata();

  const get_display_title = () => {
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

  const display_title = get_display_title();

  // If this block is streaming, show a spinner next to the text
  const tool_name_or_indicator = is_block_streaming ? (
    <StreamingIndicator type="thinking" text={display_title} className="ml-2" />
  ) : (
    <span className="font-medium">{display_title}</span>
  );

  // Determine if there's extra detail to show in the collapsible
  // e.g. 'tool_call' with arguments, or 'tool_result' with some text or an error
  const has_extra_detail =
    (type === 'tool_call' && tool_args) || (type === 'tool_result' && (result_as_content_items.length > 0 || is_error));

  // Renders the content in the collapsible body
  const render_content = () => {
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
      // Filter for text content items and extract their text
      const merged_text = result_as_content_items
        .filter((item): item is TextContent => item.type === 'text')
        .map((item) => item.text)
        .join('\n\n');
      return (
        <div className="space-y-4">
          <div className="max-w-full break-words">
            <div className="prose prose-sm dark:prose-invert prose-pre:whitespace-pre-wrap max-w-none">
              <MarkdownRenderer content={merged_text} isStreaming={is_streaming} />
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
        {!has_extra_detail ? (
          <div className="flex items-center gap-2 py-1 text-sm">
            <div className={cn('flex h-4 w-4 items-center justify-center rounded-full', bg_color)}>
              {is_streaming ? (
                <Loader2 className={cn('h-3 w-3', icon_color, 'animate-spin')} />
              ) : (
                <Icon className={cn('h-3 w-3', icon_color, icon_classes)} />
              )}
            </div>
            {tool_name_or_indicator}
          </div>
        ) : (
          <>
            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md py-1 text-sm hover:text-foreground">
              <div className={cn('flex h-4 w-4 items-center justify-center rounded-full', bg_color)}>
                {is_streaming ? (
                  <Loader2 className={cn('h-3 w-3', icon_color, 'animate-spin')} />
                ) : (
                  <Icon className={cn('h-3 w-3', icon_color, icon_classes)} />
                )}
              </div>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform duration-200', !is_open && '-rotate-90')}
              />
              {tool_name_or_indicator}
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
                  {render_content()}
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
  icon_color: string;
  bg_color: string;
  icon_classes: string;
}
