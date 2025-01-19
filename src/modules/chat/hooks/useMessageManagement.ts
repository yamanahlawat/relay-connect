import { createChatSession } from '@/lib/api/chatSessions';
import { createMessage, deleteMessage, updateMessage } from '@/lib/api/messages';
import type { components } from '@/lib/api/schema';
import type { ChatSettings, MessageRead } from '@/types/chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

type MessageCreate = components['schemas']['MessageCreate'];
type SessionCreate = components['schemas']['SessionCreate'];

interface UseMessageManagementProps {
  sessionId: string | null;
  onSessionCreate?: (sessionId: string) => void;
  streamMessage: (message: MessageRead, settings?: ChatSettings, skipUserMessage?: boolean) => Promise<void>;
  selectedProvider?: { id: string; name: string };
  selectedModel?: { id: string; name: string };
}

export function useMessageManagement({
  sessionId,
  onSessionCreate,
  streamMessage,
  selectedProvider,
  selectedModel,
}: UseMessageManagementProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutations = {
    createSession: useMutation({
      mutationFn: (data: SessionCreate) => createChatSession(data),
      onError: () => toast.error('Failed to create session'),
    }),

    createMessage: useMutation({
      mutationFn: ({ sessionId, messageData }: { sessionId: string; messageData: MessageCreate }) =>
        createMessage(sessionId, messageData),
      onError: () => toast.error('Failed to send message'),
    }),

    updateMessage: useMutation({
      mutationFn: ({
        sessionId,
        messageId,
        messageData,
      }: {
        sessionId: string;
        messageId: string;
        messageData: components['schemas']['MessageUpdate'];
      }) => updateMessage(sessionId, messageId, messageData),
      onError: () => toast.error('Failed to update message'),
    }),

    deleteMessage: useMutation({
      mutationFn: ({ sessionId, messageId }: { sessionId: string; messageId: string }) =>
        deleteMessage(sessionId, messageId),
      onError: () => toast.error('Failed to delete message'),
    }),
  };

  const handleSendMessage = useCallback(
    async (content: string, settings: ChatSettings) => {
      if (!content.trim()) return;

      if (!selectedProvider || !selectedModel) {
        toast.error('Please select a provider and model');
        return;
      }

      try {
        // Create or use existing session
        const currentSessionId =
          sessionId ||
          (
            await mutations.createSession.mutateAsync({
              title: content.slice(0, 50),
              provider_id: selectedProvider.id,
              llm_model_id: selectedModel.id,
              system_context: '', // Add system context if needed
            })
          ).id;

        if (!sessionId) {
          onSessionCreate?.(currentSessionId);
        }

        // Create user message
        const userMessage = await mutations.createMessage.mutateAsync({
          sessionId: currentSessionId,
          messageData: { content, role: 'user', status: 'completed' },
        });

        // Start streaming with model parameters
        await streamMessage(userMessage, settings);
      } catch (error) {
        console.error('Message sending error:', error);
        toast.error('Failed to send message');
      }
    },
    [
      sessionId,
      selectedProvider,
      selectedModel,
      mutations.createSession,
      mutations.createMessage,
      streamMessage,
      onSessionCreate,
    ]
  );

  const handleEditMessage = useCallback(
    async (messageId: string, content: string, settings: ChatSettings) => {
      if (!sessionId || !content.trim()) return;

      try {
        const updatedMessage = await mutations.updateMessage.mutateAsync({
          sessionId,
          messageId,
          messageData: {
            content: content.trim(),
            status: 'completed',
          },
        });

        setEditingMessageId(null);
        await streamMessage(updatedMessage, settings, true);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        console.error('Failed to edit message:', error);
        toast.error('Failed to edit message');
      }
    },
    [sessionId, mutations.updateMessage, streamMessage, queryClient]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!sessionId) return;

      try {
        await mutations.deleteMessage.mutateAsync({ sessionId, messageId });
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
        toast.success('Message deleted');
      } catch (error) {
        console.error('Failed to delete message:', error);
        toast.error('Failed to delete message');
      }
    },
    [sessionId, mutations.deleteMessage, queryClient]
  );

  return {
    editingMessageId,
    setEditingMessageId,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
  };
}
