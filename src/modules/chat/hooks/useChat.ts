import { streamCompletion } from '@/lib/api/chat';
import { parseStream } from '@/modules/chat/utils/stream';
import type { ChatState, StreamParams } from '@/types/chat';
import type { MessageRead } from '@/types/message';
import type { ToolExecution } from '@/types/stream';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface StreamState {
  content: string;
  completedTools: ToolExecution[];
  activeTool: {
    id: string;
    name: string;
    status: 'starting' | 'calling' | 'processing';
    arguments?: Record<string, unknown>;
  } | null;
  isThinking: boolean;
  thinkingText?: string;
  error?: {
    type: string;
    detail: string;
  };
}

const initialStreamState: StreamState = {
  content: '',
  completedTools: [],
  activeTool: null,
  isThinking: false,
  thinkingText: undefined,
  error: undefined,
};

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
      let streamState = { ...initialStreamState };

      // Initialize chat state with the user message and initial assistant message
      setChatState((prev) => {
        if (prev.streamingMessageId === assistantMessageId) {
          return prev;
        }

        const newMessages = [...prev.messages];
        if (!skipUserMessage && !newMessages.some((msg) => msg.id === userMessage.id)) {
          newMessages.push(userMessage);
        }

        // Initial assistant message
        const assistantMessage: MessageRead = {
          id: assistantMessageId,
          content: JSON.stringify({
            type: 'thinking',
            content: 'Thinking...',
            extraData: { blocks: [] },
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
          attachments: [],
        };

        newMessages.push(assistantMessage);

        return {
          ...prev,
          messages: newMessages,
          streamingMessageId: assistantMessageId,
        };
      });

      try {
        await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });
        const reader = await streamCompletion(sessionId, userMessage.id, params);

        for await (const block of parseStream(reader)) {
          switch (block.type) {
            case 'done':
              // If we have a final message with metadata
              if (block.message) {
                setChatState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((msg) => (msg.id === assistantMessageId ? block.message : msg)),
                  streamingMessageId: null,
                }));
              } else {
                // Ensure completed state
                setChatState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          status: 'completed',
                          content: JSON.stringify({
                            type: 'content',
                            content: streamState.content,
                            extraData: {
                              completedTools: streamState.completedTools,
                              accumulatedContent: streamState.content,
                            },
                          }),
                        }
                      : msg
                  ),
                  streamingMessageId: null,
                }));
              }
              break;

            case 'thinking':
              streamState = {
                ...streamState,
                isThinking: true,
                thinkingText: typeof block.content === 'string' ? block.content : undefined,
              };
              updateMessageState();
              break;

            case 'tool_start':
              if (block.toolCallId && block.toolName) {
                streamState = {
                  ...streamState,
                  activeTool: {
                    id: block.toolCallId,
                    name: block.toolName,
                    status: 'starting',
                  },
                  isThinking: false,
                };
                updateMessageState();
              }
              break;

            case 'tool_call':
              if (streamState.activeTool && block.toolCallId === streamState.activeTool.id) {
                streamState = {
                  ...streamState,
                  activeTool: {
                    ...streamState.activeTool,
                    status: 'calling',
                    arguments: block.toolArgs,
                  },
                };
                updateMessageState();
              }
              break;

            case 'tool_result':
              if (streamState.activeTool && block.toolCallId === streamState.activeTool.id) {
                const completedTool: ToolExecution = {
                  id: streamState.activeTool.id,
                  name: streamState.activeTool.name,
                  status: 'completed',
                  arguments: streamState.activeTool.arguments,
                  result: block.content,
                  timestamp: new Date().toISOString(),
                };

                streamState = {
                  ...streamState,
                  completedTools: [...streamState.completedTools, completedTool],
                  activeTool: null,
                };
                updateMessageState();
              }
              break;

            case 'content':
              if (typeof block.content === 'string') {
                streamState = {
                  ...streamState,
                  content: streamState.content + block.content,
                  isThinking: false,
                };
                updateMessageState();
              }
              break;

            case 'error':
              streamState = {
                ...streamState,
                error: {
                  type: block.errorType || 'UnknownError',
                  detail: block.errorDetail || 'An unknown error occurred',
                },
              };
              throw new Error(block.errorDetail);
          }
        }
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
                    errorType: streamState.error?.type || 'StreamError',
                    errorDetail: streamState.error?.detail || errorMessage,
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

      function updateMessageState() {
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: JSON.stringify({
                    type: streamState.isThinking ? 'thinking' : 'content',
                    content: streamState.content,
                    toolName: streamState.activeTool?.name,
                    toolArgs: streamState.activeTool?.arguments,
                    toolCallId: streamState.activeTool?.id,
                    extraData: {
                      completedTools: streamState.completedTools,
                      activeTool: streamState.activeTool,
                      thinkingText: streamState.thinkingText,
                      accumulatedContent: streamState.content,
                    },
                  }),
                  status: 'processing',
                }
              : msg
          ),
        }));
      }
    },
    [queryClient]
  );

  // Message editing handlers
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
