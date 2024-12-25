'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileIcon, Globe, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSend, disabled, placeholder }: ChatInputProps) {
  // Local state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [currentValue]);

  const handleChange = (newValue: string) => {
    if (isControlled) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentValue.trim() && onSend) {
      onSend(currentValue.trim());
      handleChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const hasContent = currentValue.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full border-t border-border">
      <div className="mx-auto p-4">
        <div className="relative rounded-lg border border-input bg-background">
          <Textarea
            ref={textareaRef}
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            className={cn(
              'min-h-[56px] w-full resize-none overflow-y-hidden px-4 py-4',
              'transition-[padding] duration-200 ease-in-out',
              hasContent ? 'pr-20' : 'pr-4',
              'border-0 focus-visible:ring-0',
              'placeholder:text-muted-foreground/60',
              disabled && 'opacity-50'
            )}
            disabled={disabled}
            rows={1}
          />

          <div
            className={cn(
              'absolute right-2 top-[13px] transition-all duration-200',
              hasContent ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
            )}
          >
            <Button
              type="submit"
              size="icon"
              disabled={disabled || !hasContent}
              variant="default"
              className="h-8 w-8 rounded-full"
            >
              <SendHorizontal className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              disabled={disabled}
            >
              <FileIcon className="h-4 w-4" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              disabled={disabled}
            >
              <Globe className="h-4 w-4" />
              <span className="sr-only">Search web</span>
            </Button>
          </div>

          {hasContent && (
            <div
              className={cn(
                'ml-auto pr-3 transition-all duration-200',
                hasContent ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
              )}
            >
              <span className="hidden rounded border px-2 py-0.5 text-[10px] text-muted-foreground/80 sm:inline-block">
                Shift + ⏎ for new line
              </span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
