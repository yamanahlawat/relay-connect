import { streamCompletion } from '@/lib/api/chat';
import type { MessageRead } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseMessageStreamingProps {
  sessionId: string;
  onUpdateMessages: (updateFn: (prevMessages: MessageRead[]) => MessageRead[]) => void;
}

export function useMessageStreaming({ sessionId, onUpdateMessages }: UseMessageStreamingProps) {
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleStreamError = useCallback(
    (placeholderId: string, errorMessage: string) => {
      onUpdateMessages((prev) =>
        prev.map((msg) => (msg.id === placeholderId ? { ...msg, status: 'failed', error_message: errorMessage } : msg))
      );
      setStreamingMessageId(null);
      toast.error(errorMessage);
    },
    [onUpdateMessages]
  );

  const streamMessage = useCallback(
    async (
      userMessage: MessageRead,
      params?: { max_tokens?: number; temperature?: number; top_p?: number },
      skipUserMessage: boolean = false
    ) => {
      const placeholderId = `placeholder-${Date.now()}`;

      const assistantPlaceholder: MessageRead = {
        id: placeholderId,
        content: '',
        role: 'assistant',
        status: 'pending',
        created_at: new Date().toISOString(),
        session_id: sessionId,
        error_message: null,
        error_code: null,
        usage: null,
        parent_id: null,
        extra_data: {},
      };

      // Preserve existing messages when adding new ones
      onUpdateMessages((prev) => {
        const newMessages = [...prev];
        if (!skipUserMessage) {
          const userIndex = newMessages.findIndex((msg) => msg.id === userMessage.id);
          if (userIndex === -1) {
            newMessages.push(userMessage);
          }
        }
        newMessages.push(assistantPlaceholder);
        return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });

      setStreamingMessageId(placeholderId);

      try {
        const reader = await streamCompletion(sessionId, userMessage.id, params);
        const decoder = new TextDecoder();
        let streamContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamContent += decoder.decode(value, { stream: true });
          onUpdateMessages((prev) => {
            const updatedMessages = prev.map((msg) =>
              msg.id === placeholderId ? { ...msg, content: streamContent, status: 'processing' } : msg
            );
            return updatedMessages;
          });
        }

        // Mark message as completed
        onUpdateMessages((prev) =>
          prev.map((msg) => (msg.id === placeholderId ? { ...msg, status: 'completed' } : msg))
        );

        setStreamingMessageId(null);

        // Invalidate messages query to get updated token/cost info
        await queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        handleStreamError(placeholderId, errorMessage);
      }
    },
    [sessionId, queryClient, handleStreamError, onUpdateMessages]
  );

  return {
    streamingMessageId,
    streamMessage,
  };
}
