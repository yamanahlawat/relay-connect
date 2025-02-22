import { streamCompletion } from '@/lib/api/chat';
import { parseStream } from '@/modules/chat/utils/stream';
import type { ChatState, StreamParams } from '@/types/chat';
import type { MessageRead } from '@/types/message';
import type { StreamBlock, StreamState, StreamingContent } from '@/types/stream';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useChat(sessionId: string) {
  const [chatState, setChatState] = useState<ChatState>({
    sessionId,
    messages: [],
    streamingMessageId: null,
  });

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');
  const queryClient = useQueryClient();

  const handleMessageStream = useCallback(
    async (sessionId: string, userMessage: MessageRead, params?: StreamParams, skipUserMessage: boolean = false) => {
      const assistantMessageId = `assistant-${userMessage.id}`;

      // Initialize stream state
      const streamState: StreamState = {
        contentSections: [],
        toolBlocks: [],
        lastIndex: 0,
        thinking: { isThinking: false },
      };

      // Function to get all blocks in order
      const getAllBlocks = () => {
        const allBlocks: StreamBlock[] = [];

        let currentContentIndex = 0;
        let currentToolIndex = 0;

        while (
          currentContentIndex < streamState.contentSections.length ||
          currentToolIndex < streamState.toolBlocks.length
        ) {
          const content = streamState.contentSections[currentContentIndex];
          const tool = streamState.toolBlocks[currentToolIndex];

          if (!tool || (content && content.index < tool.index)) {
            // Add content block
            allBlocks.push({
              type: 'content',
              content: content.content,
              isComplete: content.isComplete,
            });
            currentContentIndex++;
          } else {
            // Add tool block
            allBlocks.push(tool);
            currentToolIndex++;
          }
        }

        return allBlocks;
      };

      // Update assistant message with current stream state
      const updateAssistantMessage = (
        updatedFields: Partial<MessageRead> = {},
        extraState: Partial<ChatState> = {}
      ) => {
        setChatState((prev) => {
          const idx = prev.messages.findIndex((msg) => msg.id === assistantMessageId);
          if (idx === -1) return prev;

          const newMessages = [...prev.messages];
          newMessages[idx] = {
            ...newMessages[idx],
            ...updatedFields,
            extra_data: {
              stream_blocks: getAllBlocks(),
              thinking: streamState.thinking,
              error: streamState.error,
            },
          };

          return { ...prev, messages: newMessages, ...extraState };
        });
      };

      // Initial message setup
      setChatState((prev) => {
        const newMessages = [...prev.messages];
        if (!skipUserMessage && !newMessages.some((msg) => msg.id === userMessage.id)) {
          newMessages.push(userMessage);
        }

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
          extra_data: {
            stream_blocks: [],
            thinking: { isThinking: true },
          },
          attachments: [],
        };

        newMessages.push(assistantMessage);
        return { ...prev, messages: newMessages, streamingMessageId: assistantMessageId };
      });

      try {
        await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });
        const reader = await streamCompletion(sessionId, userMessage.id, params);

        let currentSection: StreamingContent | null = null;

        for await (const block of parseStream(reader)) {
          switch (block.type) {
            case 'thinking':
              streamState.thinking = {
                isThinking: true,
                content: block.content as string,
              };
              break;

            case 'content':
              // Start new section if needed
              if (!currentSection) {
                currentSection = {
                  content: '',
                  index: streamState.lastIndex++,
                  isComplete: false,
                };
                streamState.contentSections.push(currentSection);
              }

              // Accumulate content
              currentSection.content += block.content || '';
              streamState.thinking.isThinking = false;
              break;

            case 'tool_start':
              // Complete current content section if exists
              if (currentSection) {
                currentSection.isComplete = true;
                currentSection = null;
              }

              const toolStartBlock = {
                ...block,
                index: streamState.lastIndex++,
              };
              streamState.toolBlocks.push(toolStartBlock);
              break;

            case 'tool_call':
              const toolCallBlock = {
                ...block,
                index: streamState.lastIndex++,
              };
              streamState.toolBlocks.push(toolCallBlock);
              break;

            case 'tool_result':
              const toolResultBlock = {
                ...block,
                index: streamState.lastIndex++,
              };
              streamState.toolBlocks.push(toolResultBlock);
              break;

            case 'error':
              if (currentSection) {
                currentSection.isComplete = true;
              }
              streamState.error = {
                type: block.error_type || 'UnknownError',
                detail: block.error_detail || 'An unknown error occurred',
              };
              throw new Error(block.error_detail);

            case 'done':
              // Complete final section if exists
              if (currentSection) {
                currentSection.isComplete = true;
              }

              // Final update with complete message
              if (block.message) {
                updateAssistantMessage(block.message, { streamingMessageId: null });
              }
              return;
          }

          // Update message with current state
          updateAssistantMessage({
            status: 'processing',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        updateAssistantMessage(
          {
            content: errorMessage,
            status: 'failed',
            error_message: errorMessage,
          },
          { streamingMessageId: null }
        );

        toast.error('Failed to stream response', {
          description: errorMessage,
        });
      }
    },
    [queryClient]
  );

  const handleEditStart = useCallback(
    (messageId: string) => {
      const messageToEdit = chatState.messages.find((msg) => msg.id === messageId);
      if (messageToEdit) {
        setEditingMessageId(messageId);
        setEditingMessage(messageToEdit.content);
      }
    },
    [chatState.messages]
  );

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
