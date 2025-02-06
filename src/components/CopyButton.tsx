import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

export function CopyButton({ text, onCopy, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={copyToClipboard}
            className={cn(
              'rounded p-0.5 text-muted-foreground transition-all',
              'hover:text-foreground',
              'opacity-0 group-hover:opacity-100',
              copied && 'text-green-500 hover:text-green-600',
              className
            )}
          >
            <div className="relative">
              <Copy className={cn('h-4 w-4 transition-all duration-200', copied && 'scale-0 opacity-0')} />
              <Check
                className={cn(
                  'absolute left-0 top-0 h-4 w-4',
                  'transition-all duration-200',
                  'scale-0 opacity-0',
                  copied && 'scale-100 opacity-100'
                )}
              />
            </div>
            <span className="sr-only">{copied ? 'Copied!' : 'Copy message'}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{copied ? 'Copied!' : 'Copy message'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
