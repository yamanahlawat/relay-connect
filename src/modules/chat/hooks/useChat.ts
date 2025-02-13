import { streamCompletion } from '@/lib/api/chat';
import { parseStream } from '@/modules/chat/utils/stream';
import { ChatState, StreamParams } from '@/types/chat';
import { MessageRead } from '@/types/message';
import { StreamBlock } from '@/types/stream';
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
          content: JSON.stringify({
            type: 'thinking',
            content: 'Starting to process...',
          }),
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

        let currentContent = '';
        for await (const block of parseStream(reader)) {
          if (block.type === 'content' && typeof block.content === 'string') {
            // Append new content and stream it
            currentContent += block.content;
            const streamBlock: StreamBlock = {
              type: 'content',
              content: currentContent,
            };

            setChatState((prev) => ({
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: JSON.stringify(streamBlock),
                      status: 'processing',
                    }
                  : msg
              ),
            }));
          } else {
            // For non-content blocks (thinking, tool calls, etc)
            setChatState((prev) => ({
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: JSON.stringify(block),
                      status: 'processing',
                    }
                  : msg
              ),
            }));
          }

          if (block.type === 'done') {
            setChatState((prev) => ({
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: JSON.stringify({
                        type: 'done',
                        content: currentContent,
                      }),
                      status: 'completed',
                    }
                  : msg
              ),
              streamingMessageId: null,
            }));
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';

        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: JSON.stringify({
                    type: 'error',
                    errorType: 'StreamError',
                    errorDetail: errorMessage,
                  }),
                  status: 'failed',
                  error_message: errorMessage,
                }
              : msg
          ),
          streamingMessageId: null,
        }));

        toast.error('Failed to stream response', {
          description: errorMessage,
        });
      }
    },
    [queryClient]
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
