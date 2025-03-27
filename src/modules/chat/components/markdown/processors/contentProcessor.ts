import { ContentItem } from '@/types/stream';
import { processLatexContent } from './latexProcessor';
import { ProcessedContent, processThinkBlocks } from './thinkBlockProcessor';

/**
 * Main content processor that combines multiple processing steps
 * @param content String or ContentItem array to process
 */
export function processContent(content: string | ContentItem[]): ProcessedContent {
  // Convert content to string if it's not already
  const contentStr = typeof content === 'string' ? content : String(content);

  if (!contentStr.trim()) {
    return {
      type: 'regular',
      thinkContent: '',
      regularContent: '',
      isComplete: true,
    };
  }

  // First process any LaTeX content
  const processedMathContent = processLatexContent(contentStr);

  // Then process think blocks
  return processThinkBlocks(processedMathContent);
}
