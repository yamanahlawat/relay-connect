import { ContentItem } from '@/types/stream';

/**
 * Hook to process and manage markdown content
 * @param content The content to process
 * @returns Processed content string
 */
export function useContentProcessor(content: string | ContentItem[]) {
  // Derived directly from props during render — no effect/state needed.
  return typeof content === 'string' ? content : String(content);
}
