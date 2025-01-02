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

export function CopyButton({ text, onCopy, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className={cn(
        'rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
        copied && 'text-green-500',
        className
      )}
    >
      <div className="relative">
        <CopyIcon className={cn('h-4 w-4', copied && 'scale-0 opacity-0 transition-all duration-200')} />
        <Check
          className={cn(
            'absolute left-0 top-0 h-4 w-4 scale-0 opacity-0 transition-all duration-200',
            copied && 'scale-100 opacity-100'
          )}
        />
      </div>
      <span className="sr-only">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}
