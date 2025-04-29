import { cn } from '@/lib/utils';
import { ContentItem } from '@/types/stream';
import 'katex/dist/contrib/mhchem.js';
import 'katex/dist/katex.min.css';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { ThinkBlockRenderer } from './components/ThinkBlock';
import { useContentProcessor } from './hooks/useContentProcessor';
import { useLatexProcessor } from './hooks/useLatexProcessor';
import { useMarkdownComponents } from './hooks/useMarkdownComponents';
import { useStreamingState } from './hooks/useStreamingState';

export interface MarkdownRendererProps {
  /**
   * The markdown content to render
   */
  content: string | ContentItem[];
  /**
   * Whether the content is currently being streamed
   */
  isStreaming?: boolean;
}

/**
 * Main markdown renderer component
 */
export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  // Process the content using our hooks - only for think blocks
  const processedContent = useContentProcessor(content);
  // Process LaTeX syntax like \[ ... \] to $$ ... $$ for better compatibility
  const latexProcessedContent = useLatexProcessor(processedContent.regularContent);
  const markdownComponents = useMarkdownComponents();
  const { isActivelyStreaming } = useStreamingState(content, isStreaming);

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none break-words',
        isActivelyStreaming && 'duration-75 animate-in fade-in-0'
      )}
    >
      {/* Think Block Content */}
      {(processedContent.type === 'think' || processedContent.thinkContent) && (
        <ThinkBlockRenderer content={processedContent.thinkContent} isStreaming={isActivelyStreaming} />
      )}

      {/* Regular Content with Math Support - Super Simplified */}
      {processedContent.regularContent && (
        <div className={cn(isActivelyStreaming && 'opacity-90')}>
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[
              // Using a more permissive KaTeX configuration
              [rehypeKatex],
              // No sanitization for direct testing
            ]}
            components={markdownComponents}
          >
            {latexProcessedContent}
          </Markdown>
        </div>
      )}
    </div>
  );
}
