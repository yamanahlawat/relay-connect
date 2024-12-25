'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || '';
  const code = String(children).replace(/\n$/, '');

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
  };

  if (inline) {
    return (
      <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="group relative">
      {lang && (
        <div className="absolute right-2 top-2 z-10 flex gap-2">
          <div className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{lang}</div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={copyCode}
          >
            <Copy className="h-3 w-3" />
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      )}
      <div className="max-h-[400px] overflow-auto">
        <SyntaxHighlighter
          {...props}
          style={oneDark}
          language={lang}
          PreTag="div"
          className={cn('scrollbar-thin !mt-0 !bg-muted !p-4', className)}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
