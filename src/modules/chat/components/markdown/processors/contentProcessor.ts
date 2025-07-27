import { ContentItem } from '@/types/stream';

/**
 * Simple content processor - no more think block parsing needed
 * @param content String or ContentItem array to process
 */
export function processContent(content: string | ContentItem[]): string {
  // Convert content to string if it's not already
  const contentStr = typeof content === 'string' ? content : String(content);
  return contentStr;
}
