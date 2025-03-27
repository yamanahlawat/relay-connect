import { cn } from '@/lib/utils';
import { ContentItem } from '@/types/stream';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

// Import our modular components and hooks
import { MathContentWrapper, getMathPlugins } from './components/MathRenderer';
import { ThinkBlockRenderer } from './components/ThinkBlock';
import { useContentProcessor } from './hooks/useContentProcessor';
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
 * Uses a modular approach with separate processors and component renderers
 */
export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  // Process the content using our hooks
  const processedContent = useContentProcessor(content);
  const markdownComponents = useMarkdownComponents();
  const { isActivelyStreaming } = useStreamingState(content, isStreaming);

  // Get math plugins
  const [remarkMathPlugin, rehypeKatexPlugin] = getMathPlugins();

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

      {/* Regular Content */}
      {processedContent.regularContent && (
        <MathContentWrapper className={cn(isActivelyStreaming && 'opacity-90')}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMathPlugin]}
            rehypePlugins={[[rehypeSanitize], rehypeKatexPlugin]}
            components={markdownComponents}
          >
            {processedContent.regularContent}
          </ReactMarkdown>
        </MathContentWrapper>
      )}
    </div>
  );
}
