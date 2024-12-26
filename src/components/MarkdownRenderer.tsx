import { MarkdownRendererProps } from '@/types/chat';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { CodeBlock } from './CodeBlock';

const components: Partial<Components> = {
  code: CodeBlock,
  pre: ({ children, ...props }) => (
    <div className="not-prose relative my-4 overflow-hidden rounded-lg bg-zinc-950" {...props}>
      {children}
    </div>
  ),
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
  td: ({ children }) => <td className="border-b border-r px-4 py-2 last:border-r-0">{children}</td>,
  img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-lg border bg-muted" loading="lazy" />,
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
        className="space-y-3 leading-normal"
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
