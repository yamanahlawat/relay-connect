import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { useCodeCascade } from '@/stores/codeCascade';

import { Loader2, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeCascadeView() {
  const { activeCode, language, isStreaming, clearCode } = useCodeCascade();
  const { theme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Effect for auto-scrolling during streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      const scrollElement = scrollRef.current;
      requestAnimationFrame(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [activeCode, isStreaming]);

  // If there's no code, show empty state
  if (!activeCode) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-4">
        <div className="text-muted-foreground">Click on a code block to view it here</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b px-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code'}
          </span>
          {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>

        <div className="flex items-center gap-1">
          <CopyButton text={activeCode} className="h-7 w-7" />
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" onClick={clearCode}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-hidden" ref={scrollRef}>
        <div className="h-full">
          <SyntaxHighlighter
            language={language?.toLowerCase() || 'text'}
            style={theme === 'dark' ? oneDark : oneLight}
            showLineNumbers={false}
            wrapLines
            customStyle={{
              margin: 0,
              height: '100%',
              backgroundColor: 'transparent',
              fontSize: '13px',
              lineHeight: '1.6',
              padding: '1rem 1.25rem',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'var(--font-mono)',
                textRendering: 'optimizeLegibility',
              },
            }}
          >
            {activeCode}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
