import { streamCompletion } from '@/lib/api/chat';
import { ChatState, StreamParams } from '@/types/chat';
import { MessageRead } from '@/types/message';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

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
      const assistantMessageId = `assistant-${userMessage.id}`;

      setChatState((prev) => {
        // If this message is already being streamed, don't add it again
        if (prev.streamingMessageId === assistantMessageId) {
          return prev;
        }

        const newMessages = [...prev.messages];

        // Add user message if not skipping and not already present
        if (!skipUserMessage && !newMessages.some((msg) => msg.id === userMessage.id)) {
          newMessages.push(userMessage);
        }

        // Add assistant message placeholder
        const assistantMessage: MessageRead = {
          id: assistantMessageId,
          content: '',
          role: 'assistant',
          status: 'pending',
          created_at: userMessage.created_at,
          session_id: sessionId,
          error_message: null,
          error_code: null,
          usage: null,
          parent_id: userMessage.id,
          extra_data: {},
        };

        newMessages.push(assistantMessage);

        return {
          ...prev,
          messages: newMessages,
          streamingMessageId: assistantMessageId,
        };
      });

      try {
        // Prevent query updates during streaming
        await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });

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
              msg.id === assistantMessageId ? { ...msg, content: streamContent, status: 'processing' } : msg
            ),
          }));
        }

        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === assistantMessageId ? { ...msg, status: 'completed' } : msg)),
          streamingMessageId: null,
        }));

        // Now that streaming is complete, refetch messages
        await queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        handleStreamError(assistantMessageId, errorMessage);
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
