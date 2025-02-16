import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/modules/chat/components/markdown/MarkdownRenderer';
import type { ContentItem } from '@/types/stream';
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToolBlockProps {
  type: 'process' | 'call' | 'result';
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
  const [isOpen, setIsOpen] = useState(isStreaming ?? true);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  const handleCollapseChange = (open: boolean) => {
    setIsOpen(open);
    onCollapse?.(open);
  };

  const getTypeMetadata = () => {
    switch (type) {
      case 'process':
        return {
          icon: isStreaming ? Loader2 : Terminal,
          defaultTitle: content || `Processing ${toolName || ''}...`,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
        };
      case 'call':
        return {
          icon: Terminal,
          defaultTitle: `Executing ${toolName}`,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
        };
      case 'result':
        return {
          icon: isError ? AlertCircle : CheckCircle2,
          defaultTitle: `Result from ${toolName}`,
          iconColor: isError ? 'text-red-500' : 'text-green-500',
          bgColor: isError ? 'bg-red-500/10' : 'bg-green-500/10',
        };
      default:
        return {
          icon: Terminal,
          defaultTitle: content || `Tool Execution`,
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
        };
    }
  };

  const { icon: Icon, defaultTitle, iconColor, bgColor } = getTypeMetadata();

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
      case 'process':
        return (
          content || (
            <div className="flex items-center gap-2 text-muted-foreground">
              {isStreaming && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Processing tool execution...</span>
            </div>
          )
        );

      case 'call':
        return args ? (
          <div className="rounded-md bg-black/20 p-3 font-mono">
            <div className="mb-1 text-xs text-muted-foreground">Arguments:</div>
            <pre className="text-sm">
              <code>{JSON.stringify(args, null, 2)}</code>
            </pre>
          </div>
        ) : null;

      case 'result':
        if (typeof result === 'string') {
          return <MarkdownRenderer content={result} isStreaming={isStreaming} />;
        }
        if (Array.isArray(result)) {
          return result.map((item, idx) => {
            if ('text' in item) {
              return <MarkdownRenderer key={idx} content={item.text} isStreaming={isStreaming} />;
            }
            return null;
          });
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
            <Icon className={cn('h-3 w-3', iconColor)} />
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', !isOpen && '-rotate-90')} />
          <span className="font-medium">
            {defaultTitle}
            {isStreaming && type !== 'process' && '...'}
          </span>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent className="pb-4 pt-2">
          <div
            className={cn(
              'rounded-lg border bg-muted/20 p-4',
              'text-sm leading-relaxed text-muted-foreground/90',
              isError && 'border-red-500/30 bg-red-500/5'
            )}
          >
            {renderContent()}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
