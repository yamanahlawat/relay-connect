import { getMessage } from '@/lib/api/messages';
import { StreamParams } from '@/types/chat';
import { MessageRead } from '@/types/message';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseInitialMessageProps {
  sessionId: string;
  initialMessageId: string | null;
  handleMessageStream: (
    sessionId: string,
    message: MessageRead,
    streamParams?: StreamParams,
    skipUserMessage?: boolean
  ) => Promise<void>;
  clearInitialMessageId: () => void;
}

export function useInitialMessage({
  sessionId,
  initialMessageId,
  handleMessageStream,
  clearInitialMessageId,
}: UseInitialMessageProps) {
  // Add isProcessing state
  const [isProcessing, setIsProcessing] = useState(false);
  const processedRef = useRef(false);

  // Query for initial message when streaming from welcome page
  const {
    data: initialMessage,
    isError,
    error,
  } = useQuery({
    queryKey: ['message', sessionId, initialMessageId],
    queryFn: () => {
      if (!initialMessageId || !sessionId) return null;
      return getMessage(sessionId, initialMessageId);
    },
    enabled: Boolean(initialMessageId && sessionId),
  });

  // Handle success separately
  useEffect(() => {
    // Prevent processing the same message multiple times
    if (initialMessage && initialMessageId && !processedRef.current) {
      processedRef.current = true;
      setIsProcessing(true);

      // Create an async function inside useEffect
      const streamMessage = async () => {
        try {
          await handleMessageStream(sessionId, initialMessage, undefined, true);
          clearInitialMessageId();
        } catch (error) {
          toast.error(`Failed to stream initial message: ${error}`);
          clearInitialMessageId();
        } finally {
          setIsProcessing(false);
        }
      };

      // Call the async function
      streamMessage();
    }
  }, [initialMessage, sessionId, initialMessageId, handleMessageStream, clearInitialMessageId]);

  // Handle error separately
  useEffect(() => {
    if (isError) {
      clearInitialMessageId();
      setIsProcessing(false);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch initial message');
    }
  }, [isError, error, clearInitialMessageId]);

  return { initialMessage, isProcessing };
}
