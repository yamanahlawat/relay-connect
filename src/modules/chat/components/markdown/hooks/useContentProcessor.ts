import { ContentItem } from '@/types/stream';
import { useEffect, useState } from 'react';
import { processContent } from '../processors/contentProcessor';
import { ProcessedContent } from '../processors/thinkBlockProcessor';

/**
 * Hook to process and manage markdown content
 * @param content The content to process
 * @returns Processed content state
 */
export function useContentProcessor(content: string | ContentItem[]) {
  const [processedContent, setProcessedContent] = useState<ProcessedContent>({
    type: 'regular',
    thinkContent: '',
    regularContent: '',
    isComplete: false,
  });

  useEffect(() => {
    const result = processContent(content);
    setProcessedContent(result);
  }, [content]);

  return processedContent;
}
