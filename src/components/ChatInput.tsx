import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileIcon, Globe, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AdvancedSettings } from '@/components/AdvancedSettings';
import { defaultChatSettings } from '@/lib/defaults';
import { ChatInputProps } from '@/types/chat';

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  settings = defaultChatSettings,
  onSettingsChange,
  systemContext = '',
  onSystemContextChange,
}: ChatInputProps) {
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
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;

      // If content exceeds max height, enable scrolling
      textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
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
      onSend(currentValue.trim(), settings || defaultChatSettings);
      handleChange('');

      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflowY = 'hidden';
      }
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
              'min-h-[56px] w-full resize-none px-4 py-4',
              'scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 max-h-[200px] overflow-y-auto',
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
              'absolute right-3 top-[13px] transition-all duration-200',
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
            <AdvancedSettings
              settings={settings}
              onSettingsChange={onSettingsChange || (() => {})}
              systemContext={systemContext}
              onSystemContextChange={onSystemContextChange}
              disabled={disabled}
            />
          </div>

          {hasContent && (
            <div
              className={cn(
                'ml-auto transition-all duration-200',
                hasContent ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
              )}
            >
              <span className="hidden rounded border px-2 py-0.5 text-xs text-muted-foreground/80 sm:inline-block">
                Shift + ⏎ for new line
              </span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
