'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { createChatSession, getChatSession, updateChatSession } from '@/lib/api/chatSessions';
import { createMessage, deleteMessage, getMessage, listSessionMessages, updateMessage } from '@/lib/api/messages';
import type { components } from '@/lib/api/schema';
import { GENERIC_SYSTEM_CONTEXT } from '@/lib/prompts';
import { ChatInput } from '@/modules/chat/components/input/ChatInput';
import { ChatMessage } from '@/modules/chat/components/message/ChatMessage';
import { useChatState } from '@/modules/chat/hooks/useChatState';
import { ChatSplitView } from '@/modules/chat/layout/ChatSplitView';
import { useChatSettings } from '@/stores/chatSettings';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { ChatSettings } from '@/types/chat';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Types
type MessageRead = components['schemas']['MessageRead'];
type MessageCreate = components['schemas']['MessageCreate'];
type SessionCreate = components['schemas']['SessionCreate'];
type SessionUpdate = components['schemas']['SessionUpdate'];

export default function ChatPage() {
  const params = useParams();
  const { selectedProvider, selectedModel } = useProviderModel();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');
  const { initialMessageId, clearInitialMessageId } = useMessageStreamingStore();

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Chat state and settings
  const { chatState, streamMessage, updateMessagesFromQuery, setSessionId } = useChatState({
    initialSessionId: params.session_id as string,
  });

  const { settings: chatSettings, updateSettings: setChatSettings } = useChatSettings();
  const [systemContext, setSystemContext] = useState(GENERIC_SYSTEM_CONTEXT);

  // Queries
  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', chatState.sessionId],
    queryFn: async ({ pageParam = { limit: 20, offset: 0 } }) => {
      const response = await listSessionMessages(chatState.sessionId, pageParam.limit, pageParam.offset);
      return {
        messages: response.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        nextOffset: pageParam.offset + response.length,
        hasMore: response.length === pageParam.limit,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? { limit: 20, offset: lastPage.nextOffset } : undefined),
    initialPageParam: { limit: 20, offset: 0 },
    enabled: !!chatState.sessionId && !initialMessageId && !editingMessageId,
  });

  // Mutations
  const mutations = {
    createSession: useMutation({
      mutationFn: (data: SessionCreate) => createChatSession(data),
      onSuccess: (data) => setSessionId(data.id),
      onError: () => toast.error('Failed to create session'),
    }),

    updateSession: useMutation({
      mutationFn: ({ sessionId, update }: { sessionId: string; update: SessionUpdate }) =>
        updateChatSession(sessionId, update),
      onError: () => toast.error('Failed to update session'),
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

  // Initial message query
  const initialMessageQuery = useQuery({
    queryKey: ['message', chatState.sessionId, initialMessageId],
    queryFn: () => {
      if (!initialMessageId || !chatState.sessionId) return null;
      return getMessage(chatState.sessionId, initialMessageId);
    },
    enabled: Boolean(initialMessageId && chatState.sessionId),
  });

  // Session details query
  const sessionQuery = useQuery({
    queryKey: ['session', params.session_id],
    queryFn: () => getChatSession(params.session_id as string),
    enabled: !!params.session_id,
  });

  // Message handlers
  const handleSendMessage = async (content: string, settings: ChatSettings) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Handle edit mode
    if (editingMessageId) {
      try {
        const messageIndex = chatState.messages.findIndex((msg) => msg.id === editingMessageId);
        const messagesToDelete = chatState.messages.slice(messageIndex + 1);

        const updatedMessage = await mutations.updateMessage.mutateAsync({
          sessionId: chatState.sessionId,
          messageId: editingMessageId,
          messageData: {
            content: trimmedContent,
            status: 'completed',
          },
        });

        await Promise.all(
          messagesToDelete.map((msg) =>
            mutations.deleteMessage.mutateAsync({
              sessionId: chatState.sessionId,
              messageId: msg.id,
            })
          )
        );

        handleCancelEdit();

        // Pass edit mode and index to streamMessage
        await streamMessage(
          chatState.sessionId,
          updatedMessage,
          {
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            top_p: settings.topP,
          },
          true, // skipUserMessage
          true, // editMode
          messageIndex // editIndex
        );
        return;
      } catch (error) {
        console.error('Failed to edit message:', error);
        toast.error('Failed to edit message');
        return;
      }
    }

    // Regular message sending logic
    if (!selectedProvider || !selectedModel) {
      toast.error('Please select a provider and model');
      return;
    }

    try {
      // Create or use existing session
      const currentSessionId =
        chatState.sessionId ||
        (
          await mutations.createSession.mutateAsync({
            title: content.slice(0, 50),
            provider_id: selectedProvider.id,
            llm_model_id: selectedModel.id,
            system_context: systemContext,
          })
        ).id;

      // Create user message
      const userMessage = await mutations.createMessage.mutateAsync({
        sessionId: currentSessionId,
        messageData: { content: trimmedContent, role: 'user', status: 'completed' },
      });

      // Start streaming
      await streamMessage(
        currentSessionId,
        userMessage,
        {
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          top_p: settings.topP,
        },
        false // skipUserMessage
      );
    } catch (error) {
      console.error('Message sending error:', error);
      toast.error('Failed to send message');
    }
  };

  // Message grouping
  const messageGroups = useMemo(() => {
    return chatState.messages.reduce((groups: MessageRead[][], message) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup[0] && lastGroup[0].role === message.role) {
        lastGroup.push(message);
      } else {
        groups.push([message]);
      }
      return groups;
    }, []);
  }, [chatState.messages]);

  // Effects
  useEffect(() => {
    if (messagesQuery.data) {
      updateMessagesFromQuery(messagesQuery.data);
    }
  }, [messagesQuery.data, updateMessagesFromQuery]);

  useEffect(() => {
    if (initialMessageQuery.data) {
      streamMessage(chatState.sessionId, initialMessageQuery.data);
      clearInitialMessageId();
    }
  }, [initialMessageQuery.data, chatState.sessionId, streamMessage, clearInitialMessageId]);

  useEffect(() => {
    if (sessionQuery.data?.system_context) {
      setSystemContext(sessionQuery.data.system_context);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const { scrollHeight, scrollTop, clientHeight } = scrollArea;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;

    if (chatState.streamingMessageId || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatState.messages, chatState.streamingMessageId]);

  // UI handlers
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const isNearTop = target.scrollTop < 100;

      if (isNearTop && messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
        messagesQuery.fetchNextPage();
      }
    },
    [messagesQuery]
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

  const handleSystemContextChange = useCallback(
    async (newPrompt: string) => {
      setSystemContext(newPrompt);

      if (chatState.sessionId) {
        await mutations.updateSession.mutateAsync({
          sessionId: chatState.sessionId,
          update: { system_context: newPrompt },
        });
      }
    },
    [chatState.sessionId, mutations.updateSession]
  );

  return (
    <ChatSplitView>
      <div className="flex h-full flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4 md:px-8" onScroll={handleScroll}>
          <div className="mx-auto max-w-5xl space-y-4">
            {messagesQuery.isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {messageGroups.length === 0 ? (
              <EmptyStatePlaceholder />
            ) : (
              messageGroups.map((group) => (
                <ChatMessage
                  key={group[0]?.id}
                  messages={group}
                  role={group[0]?.role}
                  isStreaming={group.some((msg) => msg.id === chatState.streamingMessageId)}
                  onEditClick={group[0]?.role === 'user' ? handleEditStart : undefined}
                  editingMessageId={editingMessageId}
                />
              ))
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="w-full border-t border-border/40">
          <ChatInput
            onSend={handleSendMessage}
            disabled={!selectedProvider || !selectedModel || !!chatState.streamingMessageId}
            placeholder={getInputPlaceholder(selectedProvider, selectedModel, chatState.streamingMessageId)}
            settings={chatSettings}
            onSettingsChange={setChatSettings}
            systemContext={systemContext}
            onSystemContextChange={handleSystemContextChange}
            isEditing={!!editingMessageId}
            editMessage={editingMessage}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </ChatSplitView>
  );
}

function getInputPlaceholder(
  selectedProvider: { id: string; name: string } | undefined,
  selectedModel: { id: string; name: string } | undefined,
  streamingMessageId: string | null
): string {
  if (!selectedProvider || !selectedModel) return 'Select a provider and model to start...';
  if (streamingMessageId) return 'Please wait for the response...';
  return 'Type your message...';
}

function EmptyStatePlaceholder() {
  return (
    <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="mb-2 text-lg font-medium">No messages yet</p>
        <p className="text-sm">Start a conversation by typing a message below</p>
      </div>
    </div>
  );
}
