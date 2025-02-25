import { streamCompletion } from '@/lib/api/chat';
import { parseStream } from '@/modules/chat/utils/stream';
import type { ChatState, StreamParams } from '@/types/chat';
import type { MessageRead, StreamingMessageRead } from '@/types/message';
import type { StreamBlock, StreamState } from '@/types/stream';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

// UI-specific types (camelCase)
interface UIStreamingContent {
  content: string;
  index: number;
  isComplete: boolean;
}

interface UIStreamState {
  contentSections: UIStreamingContent[];
  toolBlocks: StreamBlock[];
  lastIndex: number;
  thinking: {
    isThinking: boolean;
    content?: string;
  };
  error?: {
    type: string;
    detail: string;
  };
}

// Helper function to convert API StreamState to UI format
function adaptStreamState(state: StreamState): UIStreamState {
  return {
    contentSections:
      state.content_sections?.map((section) => ({
        content: section.content,
        index: section.index,
        isComplete: section.is_complete,
      })) ?? [],
    toolBlocks: state.tool_blocks ?? [],
    lastIndex: state.last_index ?? 0,
    thinking: {
      isThinking: state.thinking?.is_thinking ?? false,
      content: state.thinking?.content,
    },
    error: state.error,
  };
}

// Helper function to convert UI StreamState back to API format
function reverseAdaptStreamState(state: UIStreamState): StreamState {
  return {
    content_sections:
      state.contentSections?.map((section) => ({
        content: section.content,
        index: section.index,
        is_complete: section.isComplete,
      })) ?? [],
    tool_blocks: state.toolBlocks ?? [],
    last_index: state.lastIndex ?? 0,
    thinking: {
      is_thinking: state.thinking?.isThinking ?? false,
      content: state.thinking?.content,
    },
    error: state.error,
  };
}

// Helper function to get all blocks in order
function getAllBlocks(streamState: StreamState): StreamBlock[] {
  const adaptedState = adaptStreamState(streamState);
  // Combine content sections and tool blocks into a single array with indices
  const combinedBlocks: StreamBlock[] = [
    ...adaptedState.contentSections.map((content) => ({
      type: 'content' as const,
      content: content.content,
      tool_name: null,
      tool_args: null,
      tool_call_id: null,
      tool_status: null,
      tool_result: null,
      error_type: null,
      error_detail: null,
      extra_data: null,
    })),
    ...adaptedState.toolBlocks,
  ];

  // Sort by index to maintain chronological order (using a custom property for sorting only)
  return combinedBlocks.sort((a, b) => {
    const indexA = adaptedState.contentSections.findIndex((s) => s.content === a.content);
    const indexB = adaptedState.contentSections.findIndex((s) => s.content === b.content);
    return indexA - indexB;
  });
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
  const streamStateRef = useRef<UIStreamState | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);

  // Memoized update function at hook level
  const updateAssistantMessage = useCallback(
    (updatedFields: Partial<StreamingMessageRead> = {}, extraState: Partial<ChatState> = {}) => {
      if (!streamStateRef.current || !assistantMessageIdRef.current) return;

      setChatState((prev) => {
        const idx = prev.messages.findIndex((msg) => msg.id === assistantMessageIdRef.current);
        if (idx === -1) return prev;

        const newMessages = [...prev.messages];
        newMessages[idx] = {
          ...newMessages[idx],
          ...updatedFields,
          // Ensure we always have a status
          status: updatedFields.status || (newMessages[idx]?.status ?? 'pending'),
          extra_data: {
            stream_blocks: getAllBlocks(reverseAdaptStreamState(streamStateRef.current!)),
            thinking: streamStateRef.current?.thinking,
            error: streamStateRef.current?.error,
          },
        } as StreamingMessageRead;

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
        thinking: {
          isThinking: false,
          content: undefined,
        },
        error: undefined,
      };

      // Batch initial message setup
      setChatState((prev) => {
        const newMessages = [...prev.messages];
        if (!skipUserMessage && !newMessages.some((msg) => msg.id === userMessage.id)) {
          newMessages.push(userMessage as StreamingMessageRead);
        }

        const assistantMessage: StreamingMessageRead = {
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

        let currentSection: UIStreamingContent | null = null;

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
              // Safely add content with null check
              if (currentSection) {
                currentSection.content += block.content || '';
              }
              streamStateRef.current.thinking.isThinking = false;
              break;

            case 'tool_start':
            case 'tool_call':
            case 'tool_result':
              if (currentSection) {
                currentSection.isComplete = true;
                currentSection = null;
              }
              // Use type assertion to avoid index property error
              streamStateRef.current.toolBlocks.push(block);
              break;

            case 'error':
              if (currentSection) {
                currentSection.isComplete = true;
              }
              streamStateRef.current.error = {
                type: block.error_type || 'UnknownError',
                detail: block.error_detail || 'An unknown error occurred',
              };
              // Handle potential null error_detail
              throw new Error(block.error_detail || 'Unknown error');

            case 'done':
              if (currentSection) {
                currentSection.isComplete = true;
              }
              // Check if 'message' property exists on block
              if ('message' in block && block.message) {
                updateAssistantMessage(block.message as Partial<StreamingMessageRead>, { streamingMessageId: null });
              } else {
                // If no message, just update streamingMessageId
                updateAssistantMessage({}, { streamingMessageId: null });
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
          // Use 'failed' instead of 'error'
          updateAssistantMessage({ status: 'failed' }, { streamingMessageId: null });
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
        // Handle null content
        setEditingMessage(messageToEdit.content || '');
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
