import { analyzeCode } from '@/modules/chat/utils/codeUtils';
import { useCodeCascade } from '@/stores/codeCascade';
import { ContentItem } from '@/types/stream';
import { useEffect } from 'react';

/**
 * Hook to manage streaming state for markdown content
 * @param content The content being rendered
 * @param isStreaming Whether the content is currently streaming
 * @returns Object containing streaming state information
 */
export function useStreamingState(content: string | ContentItem[], isStreaming: boolean = false) {
  const { setStreaming } = useCodeCascade();

  useEffect(() => {
    if (isStreaming) {
      const contentStr = typeof content === 'string' ? content : '';
      const analysis = analyzeCode(contentStr);

      setStreaming(analysis.hasCode, analysis.isMultiLine);
    } else {
      setStreaming(false, false);
    }
  }, [isStreaming, content, setStreaming]);

  return {
    isActivelyStreaming: isStreaming,
  };
}
