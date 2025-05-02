import { cn } from '@/lib/utils';
import { ContentItem } from '@/types/stream';
import 'katex/dist/contrib/mhchem.js';
import 'katex/dist/katex.min.css';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
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
              // Using a more permissive KaTeX configuration with all options enabled
              [
                rehypeKatex,
                {
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
                },
              ],
              // Add sanitization that allows math classes
              [
                rehypeSanitize,
                {
                  attributes: {
                    '*': ['className', 'style'],
                    span: ['className', 'style'],
                    div: ['className', 'style'],
                  },
                  // Allow KaTeX classes
                  clobberPrefix: 'user-content-',
                  tagNames: [
                    // Standard HTML tags
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'p',
                    'a',
                    'img',
                    'hr',
                    'br',
                    'b',
                    'i',
                    'strong',
                    'em',
                    'code',
                    'pre',
                    'ol',
                    'ul',
                    'li',
                    'blockquote',
                    'table',
                    'thead',
                    'tbody',
                    'tr',
                    'th',
                    'td',
                    // KaTeX specific tags
                    'span',
                    'div',
                    'svg',
                    'path',
                    'line',
                    'circle',
                    'rect',
                    'ellipse',
                    'polyline',
                    'polygon',
                    'g',
                    'defs',
                    'use',
                    'foreignObject',
                    'style',
                    'annotation',
                    'semantics',
                    'math',
                    'mrow',
                    'mfrac',
                    'msqrt',
                    'msub',
                    'msup',
                    'msubsup',
                    'munder',
                    'mover',
                    'munderover',
                    'mi',
                    'mn',
                    'mo',
                    'ms',
                    'mtext',
                    'mspace',
                    'mtable',
                    'mtr',
                    'mtd',
                    'mmultiscripts',
                    'mprescripts',
                    'none',
                  ],
                },
              ],
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
