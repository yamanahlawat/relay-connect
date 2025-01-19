import { streamCompletion } from '@/lib/api/chat';
import type { MessageRead, StreamParams } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseChatStateProps {
  initialSessionId: string;
}

interface ChatState {
  sessionId: string;
  messages: MessageRead[];
  streamingMessageId: string | null;
}

export function useChatState({ initialSessionId }: UseChatStateProps) {
  const [chatState, setChatState] = useState<ChatState>({
    sessionId: initialSessionId,
    messages: [],
    streamingMessageId: null,
  });

  const queryClient = useQueryClient();

  const handleStreamError = useCallback((placeholderId: string, errorMessage: string) => {
    setChatState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === placeholderId ? { ...msg, status: 'failed', error_message: errorMessage } : msg
      ),
      streamingMessageId: null,
    }));
    toast.error(errorMessage);
  }, []);

  const streamMessage = useCallback(
    async (
      sessionId: string,
      userMessage: MessageRead,
      params?: StreamParams,
      skipUserMessage: boolean = false,
      editMode: boolean = false,
      editIndex?: number
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

      setChatState((prev) => {
        let updatedMessages = [...prev.messages];

        if (editMode && typeof editIndex === 'number') {
          // In edit mode, insert the new message after the edited message
          updatedMessages = [...updatedMessages.slice(0, editIndex + 1), assistantPlaceholder];
        } else {
          // Normal mode
          if (!skipUserMessage) {
            const userIndex = updatedMessages.findIndex((msg) => msg.id === userMessage.id);
            if (userIndex === -1) {
              updatedMessages.push(userMessage);
            }
          }
          updatedMessages.push(assistantPlaceholder);
        }

        return {
          ...prev,
          messages: updatedMessages,
          streamingMessageId: placeholderId,
        };
      });

      try {
        const reader = await streamCompletion(sessionId, userMessage.id, params);
        const decoder = new TextDecoder();
        let streamContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamContent += decoder.decode(value, { stream: true });
          setChatState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === placeholderId ? { ...msg, content: streamContent, status: 'processing' } : msg
            ),
          }));
        }

        // Mark message as completed
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === placeholderId ? { ...msg, status: 'completed' } : msg)),
          streamingMessageId: null,
        }));

        // Invalidate messages query to get updated token/cost info
        await queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        handleStreamError(placeholderId, errorMessage);
      }
    },
    [queryClient, handleStreamError]
  );

  const updateMessagesFromQuery = useCallback((queryData: { pages: { messages: MessageRead[] }[] }) => {
    if (!queryData) return;

    const flattenedMessages = queryData.pages.flatMap((page: { messages: MessageRead[] }) => page.messages);

    setChatState((prev) => {
      // If we're streaming, merge the streaming message with the query data
      if (prev.streamingMessageId) {
        const streamingMessage = prev.messages.find((msg) => msg.id === prev.streamingMessageId);
        if (streamingMessage) {
          const messageMap = new Map(flattenedMessages.map((msg) => [msg.id, msg]));
          messageMap.set(prev.streamingMessageId, streamingMessage);
          return {
            ...prev,
            messages: Array.from(messageMap.values()).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
          };
        }
      }

      return {
        ...prev,
        messages: flattenedMessages,
      };
    });
  }, []);

  const setSessionId = useCallback((sessionId: string) => {
    setChatState((prev) => ({
      ...prev,
      sessionId,
    }));
  }, []);

  return {
    chatState,
    streamMessage,
    updateMessagesFromQuery,
    setSessionId,
  };
}
