import { streamCompletion } from '@/lib/api/chat';
import { parseStream } from '@/modules/chat/utils/stream';
import type { ChatState, StreamParams } from '@/types/chat';
import type { MessageRead } from '@/types/message';
import type { ContentItem } from '@/types/stream';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface ToolStreamState {
  content: string;
  thinking: {
    isThinking: boolean;
    content?: string;
  };
  activeTools: Map<
    string,
    {
      id: string;
      name: string;
      status: 'starting' | 'calling';
      arguments?: Record<string, unknown>;
      startTime: Date;
    }
  >;
  completedTools: Array<{
    id: string;
    name: string;
    arguments?: Record<string, unknown>;
    result?: string | ContentItem[];
    error?: string;
    startTime: Date;
    endTime: Date;
  }>;
  error?: {
    type: string;
    detail: string;
  };
}

const getInitialStreamState = () => ({
  content: '',
  thinking: { isThinking: false, content: undefined },
  activeTools: new Map(),
  completedTools: [],
  error: undefined,
});

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

      // Reset stream state at the start of each new message
      let streamState = { ...getInitialStreamState() };

      // Clear any existing message with this ID first
      // streamState.completedTools = [];
      // streamState.activeTools = new Map();

      const updateAssistantMessage = (
        updater: (msg: MessageRead) => MessageRead,
        extraState: Partial<ChatState> = {}
      ) => {
        setChatState((prev) => {
          const idx = prev.messages.findIndex((msg) => msg.id === assistantMessageId);
          if (idx === -1) return prev;
          const updatedMessage = updater(prev.messages[idx]);
          const newMessages = [...prev.messages];
          newMessages[idx] = updatedMessage;
          return { ...prev, messages: newMessages, ...extraState };
        });
      };

      // Create initial messages with streamState data
      const createMessageExtraData = (state: ToolStreamState) => ({
        type: state.thinking.isThinking ? 'thinking' : 'content',
        content: state.content,
        thinking: state.thinking,
        activeTools: Array.from(state.activeTools.values()),
        completedTools: state.completedTools,
        error: state.error,
      });

      // Initial message setup...
      setChatState((prev) => {
        if (prev.streamingMessageId === assistantMessageId) return prev;

        const newMessages = [...prev.messages];
        if (!skipUserMessage && !newMessages.some((msg) => msg.id === userMessage.id)) {
          newMessages.push(userMessage);
        }

        const assistantMessage: MessageRead = {
          id: assistantMessageId,
          content: 'Thinking...',
          role: 'assistant',
          status: 'pending',
          created_at: userMessage.created_at,
          session_id: sessionId,
          error_message: null,
          error_code: null,
          usage: null,
          parent_id: userMessage.id,
          extra_data: createMessageExtraData(streamState),
          attachments: [],
        };

        newMessages.push(assistantMessage);
        return { ...prev, messages: newMessages, streamingMessageId: assistantMessageId };
      });

      try {
        await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });
        const reader = await streamCompletion(sessionId, userMessage.id, params);

        for await (const block of parseStream(reader)) {
          switch (block.type) {
            case 'thinking':
              streamState = {
                ...streamState,
                thinking: {
                  isThinking: true,
                  content: typeof block.content === 'string' ? block.content : undefined,
                },
              };
              break;

            case 'tool_start':
              if (block.toolCallId && block.toolName) {
                const newTool = {
                  id: block.toolCallId,
                  name: block.toolName,
                  status: 'starting' as const,
                  startTime: new Date(),
                };
                streamState.activeTools.set(block.toolCallId, newTool);
                streamState.thinking.isThinking = false;
              }
              break;

            case 'tool_call':
              if (block.toolCallId && block.toolArgs) {
                const existingTool = streamState.activeTools.get(block.toolCallId);
                if (existingTool) {
                  streamState.activeTools.set(block.toolCallId, {
                    ...existingTool,
                    status: 'calling' as const,
                    arguments: block.toolArgs,
                  });
                }
              }
              break;

            case 'tool_result':
              if (block.toolCallId) {
                const completedTool = streamState.activeTools.get(block.toolCallId);
                if (completedTool) {
                  streamState.completedTools.push({
                    ...completedTool,
                    result: block.toolResult,
                    error: undefined,
                    endTime: new Date(),
                  });
                  streamState.activeTools.delete(block.toolCallId);
                }
              }
              break;

            case 'content':
              if (typeof block.content === 'string') {
                streamState = {
                  ...streamState,
                  content: streamState.content + block.content,
                  thinking: {
                    isThinking: false,
                    content: undefined,
                  },
                };
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

            case 'done':
              updateAssistantMessage(() => block.message, { streamingMessageId: null });
              break;
          }

          // Update message state after each block
          updateAssistantMessage((msg) => ({
            ...msg,
            content: streamState.content || streamState.thinking.content || 'Thinking...',
            status: 'processing',
            extra_data: createMessageExtraData(streamState),
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        updateAssistantMessage(
          (msg) => ({
            ...msg,
            content: errorMessage,
            status: 'failed',
            error_message: errorMessage,
            extra_data: {
              type: 'error',
              errorType: streamState.error?.type || 'StreamError',
              errorDetail: streamState.error?.detail || errorMessage,
            },
          }),
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
