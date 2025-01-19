import { listSessionMessages } from '@/lib/api/messages';
import type { MessageRead } from '@/types/chat';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

interface UseMessageStateProps {
  sessionId: string;
  initialMessageId?: string | null;
  isEditing?: boolean;
  streamingMessageId?: string | null;
}

export function useMessageState({ sessionId, initialMessageId, isEditing, streamingMessageId }: UseMessageStateProps) {
  const [messages, setMessages] = useState<MessageRead[]>([]);

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
    enabled: !!sessionId && !initialMessageId && !isEditing,
  });

  const updateMessagesFromQuery = useCallback(
    (queryData: typeof messagesQuery.data) => {
      if (!queryData) return;

      const flattenedMessages = queryData.pages.flatMap((page) => page.messages);

      setMessages((prevMessages) => {
        // Create a map of existing messages
        const messageMap = new Map(flattenedMessages.map((msg) => [msg.id, msg]));

        // Preserve streaming message if it exists
        if (streamingMessageId) {
          const streamingMessage = prevMessages.find((msg) => msg.id === streamingMessageId);
          if (streamingMessage) {
            messageMap.set(streamingMessageId, streamingMessage);
          }
        }

        // Convert back to sorted array
        return Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [streamingMessageId]
  );

  const messageGroups = useMemo(() => {
    return messages.reduce((groups: MessageRead[][], message) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup[0] && lastGroup[0].role === message.role) {
        lastGroup.push(message);
      } else {
        groups.push([message]);
      }
      return groups;
    }, []);
  }, [messages]);

  return {
    messages,
    setMessages,
    messageGroups,
    messagesQuery,
    updateMessagesFromQuery,
  };
}
