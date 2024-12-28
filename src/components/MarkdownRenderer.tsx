import CodeBlock from '@/components/CodeBlock';
import { MarkdownRendererProps } from '@/types/chat';
import Image from 'next/image';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const components: Partial<Components> = {
  code: CodeBlock,

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

  p: ({ children }) => <p className="leading-7 [&:not(:first-child)]:mt-4">{children}</p>,

  h1: ({ children }) => <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">{children}</h1>,

  h2: ({ children }) => <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h2>,

  h3: ({ children }) => <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h3>,

  h4: ({ children }) => <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">{children}</h4>,

  blockquote: ({ children }) => <blockquote className="mt-4 border-l-2 pl-6 italic">{children}</blockquote>,

  hr: () => <hr className="my-4 border-muted-foreground/20" />,
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
