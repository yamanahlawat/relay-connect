import { stopChatCompletion } from '@/lib/api/chat';
import { createChatSession, updateChatSession } from '@/lib/api/chatSessions';
import { createMessage, deleteMessage, listSessionMessages, updateMessage } from '@/lib/api/messages';
import type { components } from '@/lib/api/schema';
import { ChatState } from '@/types/chat';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type SessionCreate = components['schemas']['SessionCreate'];
type SessionUpdate = components['schemas']['SessionUpdate'];
type MessageCreate = components['schemas']['Body_MessageCreate'];

interface UseMessageQueriesProps {
  sessionId: string;
  initialMessageId: string | null;
  editingMessageId: string | null;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
}

export function useMessageQueries({
  sessionId,
  initialMessageId,
  editingMessageId,
  setChatState,
}: UseMessageQueriesProps) {
  const queryClient = useQueryClient();

  // Message fetching query
  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', sessionId],
    queryFn: async ({ pageParam = { limit: 20, offset: 0 } }) => {
      const response = await listSessionMessages(sessionId, pageParam.limit, pageParam.offset);
      return {
        messages: response.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        nextOffset: pageParam.offset + response.length,
        hasMore: response.length === pageParam.limit,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? { limit: 20, offset: lastPage.nextOffset } : undefined),
    initialPageParam: { limit: 20, offset: 0 },
    enabled: !!sessionId && !initialMessageId && !editingMessageId,
  });

  // Mutations
  const mutations = {
    createSession: useMutation({
      mutationFn: (data: SessionCreate) => createChatSession(data),
      onSuccess: (data) => {
        setChatState((prev) => ({ ...prev, sessionId: data.id }));
        // Invalidate chat sessions cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      },
      onError: () => toast.error('Failed to create session'),
    }),

    updateSession: useMutation({
      mutationFn: ({ sessionId, update }: { sessionId: string; update: SessionUpdate }) =>
        updateChatSession(sessionId, update),
      onSuccess: () => {
        // Invalidate specific session cache
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      },
      onError: () => toast.error('Failed to update session'),
    }),

    createMessage: useMutation({
      mutationFn: ({ sessionId, messageData }: { sessionId: string; messageData: MessageCreate }) =>
        createMessage(sessionId, messageData),
      onSuccess: () => {
        // Invalidate messages cache for this session
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      },
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
      onSuccess: () => {
        // Invalidate messages cache for this session
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      },
      onError: () => toast.error('Failed to update message'),
    }),

    deleteMessage: useMutation({
      mutationFn: ({ sessionId, messageId }: { sessionId: string; messageId: string }) =>
        deleteMessage(sessionId, messageId),
      onSuccess: () => {
        // Invalidate messages cache for this session
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      },
      onError: () => toast.error('Failed to delete message'),
    }),
    stopMessage: useMutation({
      mutationFn: () => stopChatCompletion(sessionId),
      onSuccess: () => {
        // Update chat state to mark message as completed
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === prev.streamingMessageId ? { ...msg, status: 'completed' } : msg
          ),
          streamingMessageId: null,
        }));

        // Invalidate messages cache for this session
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      },
      onError: () => toast.error('Failed to stop generation'),
    }),
  };

  return {
    messagesQuery,
    mutations,
  };
}
