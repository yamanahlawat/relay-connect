import { streamCompletion } from '@/lib/api/chat';
import type { components } from '@/lib/api/schema';
import { ChatState, StreamParams } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

type MessageRead = components['schemas']['MessageRead'];

export function useChat(sessionId: string) {
  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    sessionId,
    messages: [],
    streamingMessageId: null,
  });

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');

  const queryClient = useQueryClient();

  // Error handler
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

  // Message streaming handler
  const handleMessageStream = useCallback(
    async (sessionId: string, userMessage: MessageRead, params?: StreamParams, skipUserMessage: boolean = false) => {
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

      setChatState((prev) => ({
        ...prev,
        messages: skipUserMessage
          ? [...prev.messages, assistantPlaceholder]
          : [...prev.messages, userMessage, assistantPlaceholder],
        streamingMessageId: placeholderId,
      }));

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

        // Invalidate and refetch messages to get updated token/cost info
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        handleStreamError(placeholderId, errorMessage);
      }
    },
    [handleStreamError, queryClient]
  );

  // Handle edit start
  const handleEditStart = (messageId: string) => {
    const messageToEdit = chatState.messages.find((msg) => msg.id === messageId);
    if (messageToEdit) {
      setEditingMessageId(messageId);
      setEditingMessage(messageToEdit.content);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingMessage('');
  }, []);

  return {
    chatState,
    setChatState,
    editingMessageId,
    editingMessage,
    handleMessageStream,
    handleEditStart,
    handleCancelEdit,
  };
}
