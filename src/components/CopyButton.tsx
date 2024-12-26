import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy as CopyIcon } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showOnHover?: boolean;
}

export function CopyButton({
  text,
  onCopy,
  className,
  variant = 'ghost',
  size = 'icon',
  showOnHover = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();

      // Reset copied state after 1.5s
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'relative',
        showOnHover && 'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
        copied && 'text-green-500',
        className
      )}
      onClick={copyToClipboard}
    >
      <div className="relative">
        <CopyIcon
          className={cn(
            'h-4 w-4 transition-all duration-200',
            copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
            variant === 'ghost' && 'text-muted-foreground hover:text-foreground'
          )}
        />
        <Check
          className={cn(
            'absolute left-0 top-0 h-4 w-4 transition-all duration-200',
            copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )}
        />
      </div>
      <span className="sr-only">{copied ? 'Copied!' : 'Copy'}</span>
    </Button>
  );
}
