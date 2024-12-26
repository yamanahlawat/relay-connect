// components/CodeBlock.tsx
import { CopyButton } from '@/components/CopyButton';
import { CodeBlockProps } from '@/types/chat';
import { Terminal } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const { theme } = useTheme();
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || '';
  const code = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-primary" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted">
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b bg-muted/50 px-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase text-muted-foreground">{lang || 'Code'}</span>
        </div>
        <CopyButton text={code} size="icon" className="h-7 w-7" />
      </div>

      {/* Code Content */}
      <div className="max-h-[400px] overflow-auto">
        <SyntaxHighlighter
          {...props}
          style={theme === 'dark' ? oneDark : oneLight}
          language={lang}
          PreTag="div"
          showLineNumbers
          customStyle={{
            margin: 0,
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            style: {
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
