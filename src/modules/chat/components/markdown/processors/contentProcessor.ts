import { ContentItem } from '@/types/stream';
import { ProcessedContent, processThinkBlocks } from './thinkBlockProcessor';

/**
 * Main content processor that handles think blocks
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

  // Process think blocks - no special LaTeX processing needed
  return processThinkBlocks(contentStr);
}
