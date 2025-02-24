import { streamCompletion } from '@/lib/api/chat';
import { parseStream } from '@/modules/chat/utils/stream';
import type { ChatState, StreamParams } from '@/types/chat';
import type { MessageRead } from '@/types/message';
import type { StreamBlock, StreamState, StreamingContent } from '@/types/stream';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

// Helper function to get all blocks in order
function getAllBlocks(streamState: StreamState): StreamBlock[] {
  // Combine content sections and tool blocks into a single array with indices
  const combinedBlocks: (StreamBlock & { index: number })[] = [
    ...streamState.contentSections.map((content) => ({
      type: 'content' as const,
      content: content.content,
      isComplete: content.isComplete,
      index: content.index,
    })),
    ...streamState.toolBlocks.map((tool, idx) => ({
      ...tool,
      index: idx,
    })),
  ];

  // Sort by index to maintain chronological order
  return combinedBlocks.sort((a, b) => a.index - b.index).map((block) => block);
}

export function useChat(sessionId: string) {
  const [chatState, setChatState] = useState<ChatState>({
    sessionId,
    messages: [],
    streamingMessageId: null,
  });

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');
  const queryClient = useQueryClient();

  // Use ref for stream state to avoid recreation
  const streamStateRef = useRef<StreamState | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);

  // Memoized update function at hook level
  const updateAssistantMessage = useCallback(
    (updatedFields: Partial<MessageRead> = {}, extraState: Partial<ChatState> = {}) => {
      if (!streamStateRef.current || !assistantMessageIdRef.current) return;

      setChatState((prev) => {
        const idx = prev.messages.findIndex((msg) => msg.id === assistantMessageIdRef.current);
        if (idx === -1) return prev;

        const newMessages = [...prev.messages];
        newMessages[idx] = {
          ...newMessages[idx],
          ...updatedFields,
          extra_data: {
            stream_blocks: getAllBlocks(streamStateRef.current!),
            thinking: streamStateRef.current?.thinking,
            error: streamStateRef.current?.error,
          },
        };

        return { ...prev, messages: newMessages, ...extraState };
      });
    },
    [] // No dependencies needed as we use refs
  );

  const handleMessageStream = useCallback(
    async (sessionId: string, userMessage: MessageRead, params?: StreamParams, skipUserMessage: boolean = false) => {
      const assistantMessageId = `assistant-${userMessage.id}`;
      assistantMessageIdRef.current = assistantMessageId;

      // Initialize stream state
      streamStateRef.current = {
        contentSections: [],
        toolBlocks: [],
        lastIndex: 0,
        thinking: { isThinking: false },
      };

      // Batch initial message setup
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
          if (!streamStateRef.current) break;

          switch (block.type) {
            case 'thinking':
              streamStateRef.current.thinking = {
                isThinking: true,
                content: block.content as string,
              };
              break;

            case 'content':
              if (!currentSection) {
                currentSection = {
                  content: '',
                  index: streamStateRef.current.lastIndex++,
                  isComplete: false,
                };
                streamStateRef.current.contentSections.push(currentSection);
              }
              currentSection.content += block.content || '';
              streamStateRef.current.thinking.isThinking = false;
              break;

            case 'tool_start':
            case 'tool_call':
            case 'tool_result':
              if (currentSection) {
                currentSection.isComplete = true;
                currentSection = null;
              }
              streamStateRef.current.toolBlocks.push({
                ...block,
                index: streamStateRef.current.lastIndex++,
              });
              break;

            case 'error':
              if (currentSection) {
                currentSection.isComplete = true;
              }
              streamStateRef.current.error = {
                type: block.error_type || 'UnknownError',
                detail: block.error_detail || 'An unknown error occurred',
              };
              throw new Error(block.error_detail);

            case 'done':
              if (currentSection) {
                currentSection.isComplete = true;
              }
              if (block.message) {
                updateAssistantMessage(block.message, { streamingMessageId: null });
              }
              return;
          }

          // Batch update message state
          updateAssistantMessage();
        }
      } catch (error) {
        console.error('Stream error:', error);
        toast.error('Failed to stream message');
        if (streamStateRef.current) {
          streamStateRef.current.error = {
            type: 'StreamError',
            detail: error instanceof Error ? error.message : 'Unknown error occurred',
          };
          updateAssistantMessage({ status: 'error' }, { streamingMessageId: null });
        }
      } finally {
        streamStateRef.current = null;
        assistantMessageIdRef.current = null;
      }
    },
    [queryClient, updateAssistantMessage] // Include updateAssistantMessage in dependencies
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
