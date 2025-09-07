import { ContentItem } from '@/types/stream';
import { useEffect, useState } from 'react';

/**
 * Hook to process and manage markdown content
 * @param content The content to process
 * @returns Processed content string
 */
export function useContentProcessor(content: string | ContentItem[]) {
  const [processedContent, setProcessedContent] = useState<string>('');

  useEffect(() => {
    const result = typeof content === 'string' ? content : String(content);
    setProcessedContent(result);
  }, [content]);

  return processedContent;
}
