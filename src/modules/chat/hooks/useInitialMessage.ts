import { getMessage } from '@/lib/api/messages';
import { MessageRead } from '@/types/message';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface UseInitialMessageProps {
  sessionId: string;
  initialMessageId: string | null;
  handleMessageStream: (sessionId: string, message: MessageRead) => Promise<void>;
  clearInitialMessageId: () => void;
}

export function useInitialMessage({
  sessionId,
  initialMessageId,
  handleMessageStream,
  clearInitialMessageId,
}: UseInitialMessageProps) {
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
    if (initialMessage) {
      // Create an async function inside useEffect
      const streamMessage = async () => {
        try {
          await handleMessageStream(sessionId, initialMessage);
          clearInitialMessageId();
        } catch (error) {
          toast.error(`Failed to stream initial message : ${error}`);
          clearInitialMessageId();
        }
      };

      // Call the async function
      streamMessage();
    }
  }, [initialMessage, sessionId, handleMessageStream, clearInitialMessageId]);

  // Handle error separately
  useEffect(() => {
    if (isError) {
      clearInitialMessageId();
      toast.error(error instanceof Error ? error.message : 'Failed to fetch initial message');
    }
  }, [isError, error, clearInitialMessageId]);

  return { initialMessage };
}
