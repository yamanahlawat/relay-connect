import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Brain, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface ReasoningBlockProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Component for rendering reasoning blocks with collapsible content
 */
export function ReasoningBlockRenderer({ content, isStreaming = false }: ReasoningBlockProps) {
  // Set initial state based on streaming status
  const [isOpen, setIsOpen] = useState(isStreaming ?? false);

  // Auto-open when streaming starts, but don't auto-close when streaming ends
  // This preserves user's manual open/close preference after completion
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
    // Don't automatically close when streaming ends - let user control it
  }, [isStreaming]);

  if (!content.trim()) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-3">
      {/* Collapsible Trigger */}
      <div className="flex">
        <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground data-[state=open]:text-foreground flex items-center gap-2 rounded-md text-sm">
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', !isOpen && '-rotate-90')} />
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="font-medium">{isStreaming ? 'Thinking...' : 'Thought process'}</span>
          </div>
        </CollapsibleTrigger>
      </div>

      {/* Reasoning Block Content */}
      <CollapsibleContent className="pt-3">
        <div className="bg-muted/20 text-muted-foreground/90 rounded-lg border p-4 text-sm leading-relaxed">
          <div className="prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <MarkdownRenderer content={content} isStreaming={isStreaming} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
