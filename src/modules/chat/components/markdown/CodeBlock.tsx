import { cn } from '@/lib/utils';
import { useCodeCascade } from '@/stores/codeCascade';
import { CodeXml } from 'lucide-react';
import { useEffect } from 'react';

function CodeBlock({
  inline,
  className,
  children,
}: {
  inline: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { setActiveCode } = useCodeCascade();

  // Extract language from className
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || 'text';
  const code = String(children).replace(/\n$/, '');

  const codeLines = code.split('\n');
  const shouldShowCTA = codeLines.length > 1 || code.length > 50;

  // Store the code without opening the panel
  useEffect(() => {
    // Only trigger for non-inline code blocks with content
    if (!inline && code.trim()) {
      if (shouldShowCTA) {
        // Just store the code (don't open the panel)
        setActiveCode(code, lang, false); // Pass false to indicate not to open panel automatically
      }
    }
  }, [code, lang, inline, setActiveCode, shouldShowCTA]);

  // Handle empty or invalid code blocks
  if (!code.trim()) {
    return null;
  }

  // For inline code or single-word code references
  if (inline || (code.trim().split(/\s+/).length === 1 && !code.includes('\n'))) {
    return <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-primary">{children}</code>;
  }

  // Only show CTA if code contains actual content
  if (!shouldShowCTA) {
    return (
      <div className="relative my-4 overflow-x-auto rounded-lg bg-muted p-4">
        <code className="text-sm">{code}</code>
      </div>
    );
  }

  return (
    <div className="my-4 w-full">
      <div
        role="button"
        onClick={() => {
          // When clicked, open the panel
          setActiveCode(code, lang, true); // Pass true to indicate opening the panel on click
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
          <span className="font-medium">{lang.charAt(0).toUpperCase() + lang.slice(1)} Code</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">Click to view in editor</span>
            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>
              {codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeBlock;
