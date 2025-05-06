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

// KaTeX configuration options for math rendering
const katexOptions = {
  // Enable all KaTeX features and extensions
  strict: false,
  trust: true,
  macros: {
    // Common LaTeX macros
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\Q': '\\mathbb{Q}',
    '\\C': '\\mathbb{C}',
    '\\vec': '\\mathbf',
    // Additional macros for vector notation and projections
    '\\norm': '\\lVert#1\\rVert',
    '\\abs': '\\lvert#1\\rvert',
    '\\comp': '\\text{comp}',
    '\\proj': '\\text{proj}',
    // Chemistry-specific macros
    '\\ph': '\\text{pH}',
    '\\reaction': '\\ce{#1}',
  },
  throwOnError: false,
  errorColor: '#FF6188',
  output: 'html', // Use HTML output for better rendering
  fleqn: false, // Display math centered (not left-aligned)
  leqno: false, // Display equation numbers on the right
  displayMode: undefined, // Let KaTeX decide based on delimiters
  minRuleThickness: 0.05,
  maxSize: 10,
  maxExpand: 1000,
  globalGroup: true, // Allow macros to persist across math elements
};

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
 *
 * Renders markdown content with support for:
 * - LaTeX mathematical notation (inline and block)
 * - Code syntax highlighting
 * - Tables with proper math rendering
 * - Think blocks for LLM thought processes
 * - GFM (GitHub Flavored Markdown)
 */
export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  // Process the content to extract think blocks and regular content
  const processedContent = useContentProcessor(content);

  // Process LaTeX syntax (e.g., \[ ... \] to $$ ... $$) for better compatibility with KaTeX
  const latexProcessedContent = useLatexProcessor(processedContent.regularContent);

  // Get custom markdown components for rendering different elements
  const markdownComponents = useMarkdownComponents();

  // Determine if content is actively streaming for animation effects
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
              // Apply KaTeX processing for math rendering
              [rehypeKatex, katexOptions],
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
