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
  streamIndex: number;
}

interface UIStreamState {
  contentSections: UIStreamingContent[];
  toolBlocks: (StreamBlock & { streamIndex: number })[];
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
        streamIndex: section.stream_index ?? section.index,
      })) ?? [],
    toolBlocks: (state.tool_blocks ?? []).map((block) => ({
      ...block,
      streamIndex: block.stream_index ?? 0,
    })),
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
        stream_index: section.streamIndex, // Preserve stream order
      })) ?? [],
    tool_blocks: state.toolBlocks.map((block) => {
      // Create a new object without streamIndex to avoid type errors
      const { streamIndex, ...rest } = block;
      return { ...rest, stream_index: streamIndex };
    }),
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

  // Create content blocks with stream indices
  const contentBlocks: StreamBlock[] = adaptedState.contentSections.map((content) => ({
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
    stream_index: content.streamIndex,
  }));

  // Create combined array with all blocks
  const allBlocks = [...contentBlocks, ...adaptedState.toolBlocks];

  // Sort by stream index to maintain chronological order
  return allBlocks.sort((a, b) => {
    const indexA = a.stream_index !== undefined ? a.stream_index : 0;
    const indexB = b.stream_index !== undefined ? b.stream_index : 0;
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
      if (!assistantMessageIdRef.current) {
        return;
      }

      // Don't clear streamingMessageId unless explicitly requested
      const shouldClearStreaming = extraState.streamingMessageId === null;

      setChatState((prev) => {
        const idx = prev.messages.findIndex((msg) => msg.id === assistantMessageIdRef.current);
        if (idx === -1) {
          return prev;
        }

        // Create a copy of the messages array
        const newMessages = [...prev.messages];

        // Get current stream blocks if available
        const currentStreamBlocks = streamStateRef.current
          ? getAllBlocks(reverseAdaptStreamState(streamStateRef.current))
          : [];

        // Get the existing message and ensure it's not undefined
        const existingMessage = newMessages[idx];
        if (!existingMessage) {
          return prev;
        }

        // Get the existing extra_data with fallback
        const existingExtraData = existingMessage.extra_data || {};

        // Update the message - ensure we have all required fields
        newMessages[idx] = {
          ...existingMessage,
          ...updatedFields,
          // Ensure we always have a status
          status: updatedFields.status || existingMessage.status || 'pending',
          // Preserve and merge extra_data with proper type safety
          extra_data: {
            ...existingExtraData,
            stream_blocks: currentStreamBlocks,
            thinking: streamStateRef.current?.thinking || existingExtraData.thinking,
            error: streamStateRef.current?.error || existingExtraData.error,
          },
        } as StreamingMessageRead;

        // Create the new state with the updated messages
        const newState: ChatState = {
          ...prev,
          messages: newMessages,
        };

        // Handle streamingMessageId updates explicitly
        if (shouldClearStreaming) {
          newState.streamingMessageId = null;
        } else if (extraState.streamingMessageId !== undefined) {
          newState.streamingMessageId = extraState.streamingMessageId;
        }

        // Type-safe approach for copying remaining properties
        // Only include known properties from ChatState
        if ('sessionId' in extraState && extraState.sessionId !== undefined) {
          newState.sessionId = extraState.sessionId;
        }

        return newState;
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

      // Track stream completion
      let streamCompleted = false;
      let streamErrored = false;
      let timeoutId: NodeJS.Timeout | null = null;

      // Set a timeout to force completion if we don't get a done event
      const forceCompleteTimeout = () => {
        if (!streamCompleted && !streamErrored) {
          if (streamStateRef.current) {
            updateAssistantMessage({ status: 'completed' }, { streamingMessageId: null });
          }
          streamCompleted = true;
        }
      };

      try {
        await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });
        const reader = await streamCompletion(sessionId, userMessage.id, params);

        // Set a timeout to force completion after 30 seconds
        timeoutId = setTimeout(forceCompleteTimeout, 30000);

        let currentSection: UIStreamingContent | null = null;
        let streamIndex = 0; // Track the global order of blocks

        for await (const block of parseStream(reader)) {
          // Safety check for refs
          if (!streamStateRef.current || !assistantMessageIdRef.current) {
            break;
          }

          // Reset the timeout on each block
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(forceCompleteTimeout, 30000);
          }

          // Add stream order index to the block
          const blockWithIndex = {
            ...block,
            stream_index: streamIndex++, // Track order in stream
          };

          switch (blockWithIndex.type) {
            case 'thinking':
              streamStateRef.current.thinking = {
                isThinking: true,
                content: blockWithIndex.content as string,
              };
              // Update the UI to show thinking state
              updateAssistantMessage();
              break;

            case 'content':
              if (!currentSection) {
                currentSection = {
                  content: '',
                  index: streamStateRef.current.lastIndex++,
                  isComplete: false,
                  streamIndex: streamIndex - 1, // Use same stream index assigned to the block
                };
                streamStateRef.current.contentSections.push(currentSection);
              }

              // Safely add content with null check
              if (currentSection && blockWithIndex.content) {
                currentSection.content += blockWithIndex.content;
              }
              streamStateRef.current.thinking.isThinking = false;

              // Update UI for each content chunk to show streaming effect
              updateAssistantMessage();
              break;

            case 'tool_start':
            case 'tool_call':
            case 'tool_result':
              if (currentSection) {
                currentSection.isComplete = true;
                currentSection = null;
              }

              // Store the original stream index with the tool block
              streamStateRef.current.toolBlocks.push({
                ...blockWithIndex,
                streamIndex: streamIndex - 1, // Use same stream index assigned to the block
              });

              // Update UI for tool blocks
              updateAssistantMessage();
              break;

            case 'error':
              if (currentSection) {
                currentSection.isComplete = true;
              }
              streamStateRef.current.error = {
                type: blockWithIndex.error_type || 'UnknownError',
                detail: blockWithIndex.error_detail || 'An unknown error occurred',
              };
              streamErrored = true;

              // Update UI for error state
              updateAssistantMessage({ status: 'failed' });

              // Handle potential null error_detail
              throw new Error(blockWithIndex.error_detail || 'Unknown error');

            case 'done':
              streamCompleted = true;

              // Complete any in-progress sections
              if (currentSection) {
                currentSection.isComplete = true;
                currentSection = null;
              }

              try {
                // Store message ID locally to prevent null reference issues
                const currentMessageId = assistantMessageIdRef.current;
                if (!currentMessageId) {
                  return;
                }

                // @ts-expect-error - Accessing property that's not in the type definition
                const finalMessage = blockWithIndex.message;

                // Get current stream blocks with proper order
                const currentBlocks = streamStateRef.current
                  ? getAllBlocks(reverseAdaptStreamState(streamStateRef.current))
                  : [];

                // Update with streamed content first
                updateAssistantMessage();

                // Process the final message with usage information
                if (finalMessage && typeof finalMessage === 'object') {
                  // Extract usage information and other metadata - with null safety
                  const usage = finalMessage.usage;
                  const status = finalMessage.status;
                  const content = finalMessage.content;

                  // First update chat state to mark streaming as completed
                  setChatState((prev) => {
                    // Find the message by ID (using our locally stored ID)
                    const idx = prev.messages.findIndex((msg) => msg.id === currentMessageId);
                    if (idx === -1) {
                      return prev;
                    }

                    // Get the existing message
                    const existingMessage = prev.messages[idx];
                    if (!existingMessage) {
                      return prev;
                    }

                    // Create a copy of the message with updated information
                    const updatedMessage: StreamingMessageRead = {
                      ...existingMessage,
                      status: status || 'completed',
                      usage, // Add usage information
                      content: content || existingMessage.content || '',
                      // Extra data with safety checks
                      extra_data: {
                        ...(existingMessage.extra_data || {}),
                        stream_blocks: currentBlocks,
                      },
                    };

                    // Create a new messages array with the updated message
                    const newMessages = [...prev.messages];
                    newMessages[idx] = updatedMessage;

                    // Return updated state with streamingMessageId set to null
                    return {
                      ...prev,
                      messages: newMessages,
                      streamingMessageId: null,
                    };
                  });
                } else {
                  // If no final message data, just complete the stream
                  setChatState((prev) => {
                    const idx = prev.messages.findIndex((msg) => msg.id === currentMessageId);
                    if (idx === -1) {
                      return prev;
                    }

                    // Get the existing message with null safety
                    const existingMessage = prev.messages[idx];
                    if (!existingMessage) {
                      return prev;
                    }

                    // Create a new messages array with updated status
                    const newMessages = [...prev.messages];
                    newMessages[idx] = {
                      ...existingMessage,
                      status: 'completed',
                      // Ensure extra_data is defined
                      extra_data: existingMessage.extra_data || {
                        stream_blocks: [],
                      },
                    } as StreamingMessageRead;

                    return {
                      ...prev,
                      messages: newMessages,
                      streamingMessageId: null,
                    };
                  });
                }

                // Clear timeout
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }

                // Add a small delay before clearing refs to ensure state updates are processed
                setTimeout(() => {
                  // Now it's safe to clear the refs
                  streamStateRef.current = null;
                  assistantMessageIdRef.current = null;
                }, 100);

                // Return to exit the loop
                return;
              } catch (error) {
                console.error('Error processing done event:', error);

                // Store the message ID locally
                const currentMessageId = assistantMessageIdRef.current;

                // Force state update on error, preserving the message ID
                if (currentMessageId) {
                  setChatState((prev) => {
                    const idx = prev.messages.findIndex((msg) => msg.id === currentMessageId);
                    if (idx === -1) return prev;

                    // Get the existing message with null safety
                    const existingMessage = prev.messages[idx];
                    if (!existingMessage) {
                      return prev;
                    }

                    // Create a new messages array with updated status
                    const newMessages = [...prev.messages];
                    newMessages[idx] = {
                      ...existingMessage,
                      status: 'completed',
                      // Ensure extra_data is defined
                      extra_data: existingMessage.extra_data || {
                        stream_blocks: [],
                      },
                    } as StreamingMessageRead;

                    return {
                      ...prev,
                      messages: newMessages,
                      streamingMessageId: null,
                    };
                  });
                }

                // Clear refs after state update
                setTimeout(() => {
                  streamStateRef.current = null;
                  assistantMessageIdRef.current = null;
                }, 100);

                return;
              }
          }
        }

        // If we got here without setting streamCompleted, something went wrong
        if (!streamCompleted && !streamErrored) {
          console.warn('Stream loop ended without completion or error');
        }
      } catch (error) {
        console.error('Stream error:', error);
        toast.error('Failed to stream message');
        streamErrored = true;

        if (streamStateRef.current) {
          streamStateRef.current.error = {
            type: 'StreamError',
            detail: error instanceof Error ? error.message : 'Unknown error occurred',
          };
          updateAssistantMessage({ status: 'failed' }, { streamingMessageId: null });
        }
      } finally {
        // Clear the timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Final fallback to ensure completion
        if (!streamCompleted && !streamErrored) {
          console.warn('Stream ended in finally block without completion, forcing completion');
          updateAssistantMessage({ status: 'completed' }, { streamingMessageId: null });
        }

        // Clear refs if they haven't been cleared already
        if (streamStateRef.current || assistantMessageIdRef.current) {
          streamStateRef.current = null;
          assistantMessageIdRef.current = null;
        }
      }
    },
    [queryClient, updateAssistantMessage, setChatState]
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
