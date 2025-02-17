import JsonCodeBlock from '@/components/JsonCodeBlock';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/modules/chat/components/markdown/MarkdownRenderer';
import type { ContentItem, StreamBlockType } from '@/types/stream';
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Terminal } from 'lucide-react';
import { useState } from 'react';
import StreamingIndicator from './StreamingIndicator';

interface ToolBlockProps {
  type: Extract<StreamBlockType, 'tool_start' | 'tool_call' | 'tool_result'>;
  toolName?: string;
  content?: string;
  args?: Record<string, unknown>;
  result?: string | ContentItem[];
  isStreaming?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onCollapse?: (isOpen: boolean) => void;
}

export default function ToolBlock({
  type,
  toolName,
  content,
  args,
  result,
  isStreaming,
  isError,
  errorMessage,
  onCollapse,
}: ToolBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCollapseChange = (open: boolean) => {
    setIsOpen(open);
    onCollapse?.(open);
  };

  const getTypeMetadata = () => {
    switch (type) {
      case 'tool_start':
        return {
          icon: isStreaming ? Loader2 : Terminal,
          defaultTitle: content || `Processing ${toolName || ''}`,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          iconClasses: isStreaming ? 'animate-spin' : '',
        };
      case 'tool_call':
        return {
          icon: isStreaming ? Loader2 : Terminal,
          defaultTitle: `Executing ${toolName}`,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          iconClasses: isStreaming ? 'animate-spin' : '',
        };
      case 'tool_result':
        return {
          icon: isError ? AlertCircle : isStreaming ? Loader2 : CheckCircle2,
          defaultTitle: `Result from ${toolName}`,
          iconColor: isError ? 'text-red-500' : isStreaming ? 'text-blue-500' : 'text-green-500',
          bgColor: isError ? 'bg-red-500/10' : isStreaming ? 'bg-blue-500/10' : 'bg-green-500/10',
          iconClasses: isStreaming ? 'animate-spin' : '',
        };
      default:
        return {
          icon: Terminal,
          defaultTitle: content || 'Tool Execution',
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
          iconClasses: '',
        };
    }
  };

  const { icon: Icon, defaultTitle, iconColor, bgColor, iconClasses } = getTypeMetadata();

  const toolNameOrIndicator = isStreaming ? (
    <StreamingIndicator type="thinking" text={defaultTitle} className="ml-2" />
  ) : (
    <span className="font-medium">{defaultTitle}</span>
  );

  const renderContent = () => {
    if (isError) {
      return (
        <div className="text-red-500">
          <p className="font-medium">Error executing tool</p>
          <p className="text-sm opacity-90">{errorMessage}</p>
        </div>
      );
    }

    switch (type) {
      case 'tool_start':
        return (
          content || (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing tool execution...</span>
            </div>
          )
        );

      case 'tool_call':
        return args ? (
          <div className="rounded-md font-mono text-sm">
            <div className="mb-1 text-xs text-muted-foreground">Arguments:</div>
            <pre className="whitespace-pre-wrap break-words text-foreground">
              <JsonCodeBlock data={args} />
            </pre>
          </div>
        ) : null;

      case 'tool_result':
        if (typeof result === 'string') {
          return (
            <div className="max-w-full break-words">
              <div className="prose prose-sm dark:prose-invert prose-pre:whitespace-pre-wrap max-w-none">
                <MarkdownRenderer content={result} isStreaming={isStreaming} />
              </div>
            </div>
          );
        }
        if (Array.isArray(result)) {
          return (
            <div className="space-y-4">
              {result.map((item, idx) => {
                if ('text' in item) {
                  return (
                    <div key={idx} className="max-w-full break-words">
                      <div className="prose prose-sm dark:prose-invert prose-pre:whitespace-pre-wrap max-w-none">
                        <MarkdownRenderer content={item.text} isStreaming={isStreaming} />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        return content;

      default:
        return content;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleCollapseChange}>
      <div className="relative pl-5">
        {/* Vertical line connector */}
        <div className="absolute left-2 top-0 h-full w-px bg-border" />

        {/* Header */}
        <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md py-1 text-sm hover:text-foreground">
          <div className={cn('flex h-4 w-4 items-center justify-center rounded-full', bgColor)}>
            <Icon className={cn('h-3 w-3', iconColor, iconClasses)} />
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', !isOpen && '-rotate-90')} />
          {toolNameOrIndicator}
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent className="pb-4 pt-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Tool Execution Details</h4>
            <div
              className={cn(
                'overflow-x-auto rounded-lg border bg-muted/20 p-4',
                'text-sm leading-relaxed text-muted-foreground/90',
                isError && 'border-red-500/30 bg-red-500/5'
              )}
            >
              {renderContent()}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
