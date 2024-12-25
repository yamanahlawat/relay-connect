'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const components: Partial<Components> = {
  code: CodeBlock,
  // Remove the p component override since it's causing issues
  pre: ({ children, ...props }) => (
    <div className="not-prose relative my-4 overflow-hidden rounded-lg border bg-muted/50" {...props}>
      {children}
    </div>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-4 ml-6 list-disc space-y-2 [&>li]:mt-2">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-2 [&>li]:mt-2">{children}</ol>,
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-code:text-primary prose-headings:font-semibold max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
