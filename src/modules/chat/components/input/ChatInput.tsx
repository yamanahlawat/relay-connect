import FilePreview from '@/components/FilePreview/FilePreview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { defaultChatSettings } from '@/lib/defaults';
import { cn } from '@/lib/utils';
import MCPServers from '@/modules/chat/components/mcp/Servers';
import { AdvancedSettings } from '@/modules/chat/components/settings/AdvancedSettings';
import { FilePreviewData, UploadFile } from '@/types/attachment';
import { ChatInputProps } from '@/types/chat';
import { Paperclip, Pencil, SendHorizontal, StopCircle, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  isEditing,
  editMessage = '',
  onCancelEdit,
  isStreaming,
  onStop,
  fileUpload,
}: ChatInputProps) {
  // Local state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handling
  const { files, uploadFiles, removeFile, getAttachmentIds, clearFiles, isUploading } = fileUpload;

  // Determine controlled vs. uncontrolled mode
  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    if (editMessage) {
      if (isControlled) {
        onChange(editMessage);
      } else {
        setInternalValue(editMessage);
      }
    }
  }, [isEditing, editMessage, isControlled, onChange]);

  const handleCancelEdit = () => {
    if (isControlled) {
      onChange('');
    } else {
      setInternalValue('');
    }
    clearFiles();
    onCancelEdit?.();
  };

  const handleChange = (newValue: string) => {
    if (isControlled) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((file) => {
        // Accept all file types that are supported by the file upload hook
        return file.size <= 20 * 1024 * 1024; // 20MB limit
      });
      if (validFiles.length > 0) {
        uploadFiles(validFiles);
      }
    },
    [uploadFiles]
  );

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attachmentIds = getAttachmentIds();
    const hasContent = currentValue.trim().length > 0 || attachmentIds.length > 0;

    if (hasContent && onSend && !isUploading) {
      onSend(currentValue.trim(), attachmentIds, settings || defaultChatSettings);
      handleChange('');
      clearFiles();

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

  // Auto-resize the textarea as needed
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
    }
  }, [currentValue]);

  // Transform the files from the upload hook into the common FilePreviewData shape.
  const filePreviewData: FilePreviewData[] = files.map((file: UploadFile) => ({
    id: file.id,
    file_name: file.file.name,
    absolute_url: file.absolute_url,
    status: file.status,
  }));

  const hasContent = currentValue.trim().length > 0 || files.length > 0;

  return (
    <form onSubmit={handleSubmit} className="border-border w-full border-t">
      <div className="mx-auto p-4">
        <div className="border-input bg-background relative rounded-lg border">
          {/* Display file previews if there are files */}
          {files.length > 0 && <FilePreview files={filePreviewData} onRemove={removeFile} showPreview imageSize="sm" />}

          {isEditing && (
            <div className="flex items-center justify-between bg-orange-100 px-4 py-1 dark:bg-orange-950/50">
              <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-400">
                <Pencil className="h-3.5 w-3.5" />
                <span>Editing will remove all subsequent messages</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelEdit}
                className="h-6 w-6 text-orange-700/70 hover:bg-orange-200/50 hover:text-orange-700 dark:text-orange-400/70 dark:hover:bg-orange-900/50 dark:hover:text-orange-400"
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Cancel edit</span>
              </Button>
            </div>
          )}

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className={cn(
                'min-h-[56px] w-full resize-none px-4 py-4',
                'scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20 max-h-[200px] overflow-y-auto',
                'transition-[padding] duration-200 ease-in-out',
                hasContent ? 'pr-20' : 'pr-4',
                'border-0 focus-visible:ring-0',
                'placeholder:text-muted-foreground/60',
                disabled && 'opacity-50',
                isEditing && 'border-t border-orange-200 dark:border-orange-900'
              )}
              disabled={disabled}
              rows={1}
              spellCheck="true"
            />

            <div
              className={cn(
                'absolute top-1/2 right-3 -translate-y-1/2 transition-all duration-200',
                'flex items-center gap-2'
              )}
            >
              {isStreaming ? (
                <TooltipProvider delayDuration={200} skipDelayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        onClick={onStop}
                        variant="default"
                        className="h-8 w-8 rounded-full"
                      >
                        <StopCircle className="h-4 w-4" />
                        <span className="sr-only">Stop response</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Stop response (Esc)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                hasContent && (
                  <TooltipProvider delayDuration={200} skipDelayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent side="left">Send message</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-0.5">
            <TooltipProvider delayDuration={200} skipDelayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    onMouseDown={(e) => e.preventDefault()}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer rounded-full"
                    disabled={disabled}
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Attach files</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach files</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AdvancedSettings
              settings={settings}
              onSettingsChange={onSettingsChange || (() => {})}
              systemContext={systemContext}
              onSystemContextChange={onSystemContextChange}
              disabled={disabled}
            />
            <MCPServers />
          </div>

          {hasContent && (
            <div
              className={cn(
                'ml-auto transition-all duration-200',
                hasContent ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
              )}
            >
              <span className="text-muted-foreground/80 hidden rounded border px-2 py-0.5 text-xs sm:inline-block">
                Shift + ⏎ for new line
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.json,.html,.css,.js,.xml"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </form>
  );
}
