import { cn } from '@/lib/utils';
import { analyzeCode } from '@/modules/chat/utils/codeUtils';
import { useCodeCascade } from '@/stores/codeCascade';
import { CodeXml } from 'lucide-react';
import { useEffect } from 'react';
import { CodeBlockProps } from '../types/markdownTypes';

/**
 * Component for rendering code blocks with syntax highlighting and interaction
 */
function CodeBlock({ className, children }: CodeBlockProps) {
  const { setActiveCode } = useCodeCascade();

  // Extract language from className
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || 'text';

  // Handle case where children might be undefined (when passed as third argument to createElement)
  const code = children ? String(children).replace(/\n$/, '') : '';

  // Use our comprehensive analysis utility
  const analysis = analyzeCode(code, lang);

  // Determine if this is inline code - either explicitly passed as inline,
  // or single-line code with no language class
  const isInline = !analysis.isMultiLine;

  // Store the code without opening the panel
  useEffect(() => {
    // Only trigger for multi-line code blocks with content that should show cascade
    if (!isInline && code.trim() && analysis.shouldShowCascade) {
      // For multi-line code, automatically open the panel (set third parameter to true)
      setActiveCode(code, lang, true);
    }
  }, [code, lang, isInline, setActiveCode, analysis.shouldShowCascade]);

  // Handle empty code blocks
  if (!code.trim()) {
    return null;
  }

  // For inline code or single-line code
  if (isInline) {
    return <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-primary">{children}</code>;
  }

  // For code blocks that shouldn't trigger cascade
  if (!analysis.shouldShowCascade) {
    return (
      <div className="relative my-4 overflow-x-auto rounded-lg bg-muted p-4">
        <pre className="whitespace-pre-wrap break-words text-sm">
          <code className="font-mono">{code}</code>
        </pre>
      </div>
    );
  }

  // For code blocks that should trigger cascade
  return (
    <div className="my-4 w-full">
      <div
        role="button"
        onClick={() => {
          // When clicked, open the panel
          setActiveCode(code, lang, true);
        }}
        className={cn(
          'flex cursor-pointer items-center gap-3',
          'rounded-lg border bg-muted/50 p-3',
          'transition-colors hover:bg-muted'
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
          <CodeXml className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-1 overflow-hidden">
          <span className="font-medium">
            {lang.charAt(0).toUpperCase() + lang.slice(1)} {lang !== 'text' ? 'Code' : 'Block'}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">Click to view in editor</span>
            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>
              {analysis.lineCount} {analysis.lineCount === 1 ? 'line' : 'lines'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeBlock;
