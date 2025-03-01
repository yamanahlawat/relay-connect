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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const baseStyle = theme === 'dark' ? oneDark : oneLight;

  const modifiedStyle = {
    ...baseStyle,
    // Remove any background property to avoid conflicts
    'pre[class*="language-"]': {
      ...baseStyle['pre[class*="language-"]'],
      background: undefined,
      backgroundColor: undefined,
    },
    'code[class*="language-"]': {
      ...baseStyle['code[class*="language-"]'],
      background: undefined,
      backgroundColor: undefined,
    },
  };

  // Setup MutationObserver for content changes
  useEffect(() => {
    if (wrapperRef.current && isStreaming) {
      // Cleanup previous observer if exists
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new observer
      const observer = new MutationObserver(() => {
        const element = wrapperRef.current;
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      });

      // Start observing the wrapper for content changes
      observer.observe(wrapperRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      observerRef.current = observer;

      // Cleanup
      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }
  }, [isStreaming]);

  // Initial scroll for new content
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollTop = wrapperRef.current.scrollHeight;
    }
  }, [activeCode]);

  if (!activeCode && isStreaming) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-4">
        <div className="text-muted-foreground">Click on a code block to view it here</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header remains the same */}
      <div className="flex h-11 items-center justify-between border-b px-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code'}
          </span>
          {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>

        <div className="flex items-center gap-1">
          <CopyButton text={activeCode} className="h-7 w-7 opacity-100" />
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" onClick={clearCode}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Code Content with position relative for proper scrolling */}
      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-auto" ref={wrapperRef}>
          <SyntaxHighlighter
            language={language?.toLowerCase() || 'text'}
            style={modifiedStyle}
            showLineNumbers={false}
            wrapLines
            customStyle={{
              margin: 0,
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
