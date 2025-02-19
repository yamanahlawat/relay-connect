import { cn } from '@/lib/utils';
import CodeBlock from '@/modules/chat/components/markdown/CodeBlock';
import ThinkBlock from '@/modules/chat/components/markdown/ThinkBlock';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface ProcessedContent {
  type: 'regular' | 'think';
  thinkContent: string;
  regularContent: string;
  isComplete: boolean;
}

interface MarkdownNode {
  type: string;
  tagName?: string;
  children?: MarkdownNode[];
}

export interface MarkdownRendererProps {
  /**
   * The markdown content to render
   */
  content: string;
  /**
   * Whether the content is currently being streamed
   */
  isStreaming?: boolean;
}

/**
 * Markdown component configuration
 */
const markdownComponents: Partial<Components> = {
  code: ({ className, children }) => {
    const content = String(children).trim();
    if (content.split('\n').length === 1 && !className) {
      return <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{content}</code>;
    }
    return (
      <CodeBlock inline={false} className={className}>
        {children}
      </CodeBlock>
    );
  },

  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
    >
      {children}
    </a>
  ),

  ul: ({ children }) => <ul className="my-3 ml-6 list-disc space-y-2 marker:text-muted-foreground">{children}</ul>,

  ol: ({ children }) => <ol className="my-3 ml-6 list-decimal space-y-2 marker:text-muted-foreground">{children}</ol>,

  table: ({ children }) => (
    <div className="my-4 w-full overflow-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),

  th: ({ children }) => (
    <th className="border-b border-r bg-muted px-4 py-2 text-left font-medium last:border-r-0">{children}</th>
  ),

  img: ({ src, alt }) => (
    <Image
      src={src || ''}
      alt={alt || ''}
      className="rounded-lg border bg-muted"
      loading="lazy"
      width={500}
      height={300}
    />
  ),

  pre: ({ children }) => children,

  p: ({ children, node }) => {
    const hasCodeBlock = (node as MarkdownNode)?.children?.some(
      (child) => child.type === 'element' && (child.tagName === 'code' || child.tagName === 'pre')
    );

    if (hasCodeBlock) {
      return <div className="my-4">{children}</div>;
    }

    return <p className="leading-7 [&:not(:first-child)]:mt-4">{children}</p>;
  },
  hr: () => <hr className="my-2" />,
};

/**
 * MarkdownRenderer component
 * Renders markdown content with support for think blocks and streaming
 */
export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  const [processedContent, setProcessedContent] = useState<ProcessedContent>({
    type: 'regular',
    thinkContent: '',
    regularContent: '',
    isComplete: false,
  });

  useEffect(() => {
    // Only process think tags if content is a string
    if (typeof content !== 'string') {
      setProcessedContent({
        type: 'regular',
        thinkContent: '',
        regularContent: String(content),
        isComplete: true,
      });
      return;
    }

    // Check for think block tags
    const hasOpeningTag = content.includes('<think>');
    const hasClosingTag = content.includes('</think>');

    if (!hasOpeningTag && !hasClosingTag) {
      setProcessedContent({
        type: 'regular',
        thinkContent: '',
        regularContent: content,
        isComplete: true,
      });
      return;
    }

    let thinkContent = '';
    let regularContent = '';

    if (hasOpeningTag) {
      const [beforeThink, ...rest] = content.split('<think>');
      regularContent = beforeThink;
      const afterThink = rest.join('<think>');

      if (hasClosingTag) {
        const [think, ...remaining] = afterThink.split('</think>');
        thinkContent = think;
        regularContent += remaining.join('</think>');
      } else {
        thinkContent = afterThink;
      }
    }

    setProcessedContent({
      type: hasClosingTag ? 'regular' : 'think',
      thinkContent: thinkContent.trim(),
      regularContent: regularContent.trim(),
      isComplete: hasOpeningTag && hasClosingTag,
    });
  }, [content]);

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none break-words',
        isStreaming && 'duration-75 animate-in fade-in-0'
      )}
    >
      {/* Think Block Content */}
      {(processedContent.type === 'think' || processedContent.thinkContent) && (
        <ThinkBlock isStreaming={isStreaming}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeSanitize, rehypeKatex]}
            components={markdownComponents}
          >
            {processedContent.thinkContent}
          </ReactMarkdown>
        </ThinkBlock>
      )}

      {/* Regular Content */}
      {processedContent.regularContent && (
        <div className={cn(isStreaming && 'opacity-90')}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeSanitize, rehypeKatex]}
            components={markdownComponents}
          >
            {processedContent.regularContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
