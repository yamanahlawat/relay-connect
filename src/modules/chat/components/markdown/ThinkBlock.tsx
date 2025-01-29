import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Brain, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ThinkBlockProps {
  children: React.ReactNode;
  isStreaming?: boolean;
}

export default function ThinkBlock({ children, isStreaming }: ThinkBlockProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-3">
      {/* Collapsible Trigger */}
      <div className="flex">
        <CollapsibleTrigger
          className="group flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground data-[state=open]:text-foreground"
          aria-label="Toggle thought process"
          role="button"
        >
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', !isOpen && '-rotate-90')} />
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="font-medium">Thought process</span>
          </div>
        </CollapsibleTrigger>
      </div>

      {/* Think Block Content */}
      <CollapsibleContent className="pt-3">
        <div
          className={cn(
            'rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground/90',
            isStreaming && 'animate-pulse'
          )}
        >
          <div
            className={cn(
              'prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
              'text-[14px] leading-relaxed',
              isStreaming && 'animate-in fade-in-0'
            )}
          >
            {children}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
