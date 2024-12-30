'use client';

import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatSplitView } from '@/components/ChatSplitView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { streamCompletion } from '@/lib/api/chat';
import { createChatSession, getChatSession, updateChatSession } from '@/lib/api/chatSessions';
import { createMessage, getMessage, listSessionMessages } from '@/lib/api/messages';
import type { components } from '@/lib/api/schema';
import { GENERIC_SYSTEM_CONTEXT } from '@/lib/prompts';
import { useChatSettings } from '@/stores/chatSettings';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { ChatSettings, ChatState, StreamParams } from '@/types/chat';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const { initialMessageId, clearInitialMessageId } = useMessageStreamingStore();

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    sessionId: params.session_id as string,
    messages: [],
    streamingMessageId: null,
  });

  const { settings: chatSettings, updateSettings: setChatSettings } = useChatSettings();

  const [systemContext, setSystemContext] = useState(GENERIC_SYSTEM_CONTEXT);

  // Message fetching query
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
    enabled: !!chatState.sessionId && !initialMessageId,
  });

  // Mutations
  const mutations = {
    createSession: useMutation({
      mutationFn: (data: SessionCreate) => createChatSession(data),
      onSuccess: (data) => setChatState((prev) => ({ ...prev, sessionId: data.id })),
      onError: () => toast.error('Failed to create session'),
    }),

    createMessage: useMutation({
      mutationFn: ({ sessionId, messageData }: { sessionId: string; messageData: MessageCreate }) =>
        createMessage(sessionId, messageData),
      onError: () => toast.error('Failed to send message'),
    }),

    updateSession: useMutation({
      mutationFn: ({ sessionId, update }: { sessionId: string; update: SessionUpdate }) =>
        updateChatSession(sessionId, update),
      onError: () => toast.error('Failed to update session'),
    }),
  };

  // Error handler
  const handleStreamError = useCallback((placeholderId: string, errorMessage: string) => {
    setChatState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === placeholderId ? { ...msg, status: 'failed', error_message: errorMessage } : msg
      ),
      streamingMessageId: null,
    }));
    toast.error(errorMessage);
  }, []);

  // Message streaming handler
  const handleMessageStream = useCallback(
    async (sessionId: string, userMessage: MessageRead, params?: StreamParams) => {
      // Create placeholder for assistant response
      const placeholderId = `placeholder-${Date.now()}`;
      const assistantPlaceholder: MessageRead = {
        id: placeholderId,
        content: '',
        role: 'assistant',
        status: 'pending',
        created_at: new Date().toISOString(),
        session_id: sessionId,
        error_message: null,
        error_code: null,
        usage: null,
        parent_id: null,
        extra_data: {},
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantPlaceholder],
        streamingMessageId: placeholderId,
      }));
      try {
        const reader = await streamCompletion(sessionId, userMessage.id, params);
        const decoder = new TextDecoder();
        let streamContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamContent += decoder.decode(value, { stream: true });
          setChatState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === placeholderId ? { ...msg, content: streamContent, status: 'processing' } : msg
            ),
          }));
        }

        // Mark message as completed
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === placeholderId ? { ...msg, status: 'completed' } : msg)),
          streamingMessageId: null,
        }));

        // Invalidate and refetch messages to get updated token/cost info
        queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stream response';
        handleStreamError(placeholderId, errorMessage);
      }
    },
    [handleStreamError, queryClient]
  );

  const handleSystemContextChange = async (newPrompt: string) => {
    setSystemContext(newPrompt);

    if (chatState.sessionId) {
      await mutations.updateSession.mutateAsync({
        sessionId: chatState.sessionId,
        update: {
          system_context: newPrompt,
        },
      });
    }
  };

  // Query for initial message when streaming from welcome page
  const {
    data: initialMessage,
    isError,
    error,
  } = useQuery({
    queryKey: ['message', chatState.sessionId, initialMessageId],
    queryFn: () => {
      if (!initialMessageId || !chatState.sessionId) return null;
      return getMessage(chatState.sessionId, initialMessageId);
    },
    enabled: Boolean(initialMessageId && chatState.sessionId),
  });

  // Handle success separately
  useEffect(() => {
    if (initialMessage) {
      // Create an async function inside useEffect
      const streamMessage = async () => {
        try {
          await handleMessageStream(chatState.sessionId, initialMessage);
          clearInitialMessageId();
        } catch (error) {
          console.error('Error streaming initial message:', error);
          toast.error('Failed to stream initial message');
          clearInitialMessageId();
        }
      };

      // Call the async function
      streamMessage();
    }
  }, [initialMessage, chatState.sessionId, handleMessageStream, clearInitialMessageId]);
  // Handle error separately
  useEffect(() => {
    if (isError) {
      clearInitialMessageId();
      toast.error(error instanceof Error ? error.message : 'Failed to fetch initial message');
    }
  }, [isError, error, clearInitialMessageId]);

  // Message sending handler
  const handleSendMessage = async (content: string, settings: ChatSettings) => {
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

      // If session exists and system prompt changed, update it
      if (chatState.sessionId && systemContext) {
        await mutations.updateSession.mutateAsync({
          sessionId: chatState.sessionId,
          update: { system_context: systemContext },
        });
      }

      // Create user message
      const userMessage = await mutations.createMessage.mutateAsync({
        sessionId: currentSessionId,
        messageData: { content, role: 'user', status: 'completed' },
      });

      // Start streaming with model parameters
      await handleMessageStream(currentSessionId, userMessage, {
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        top_p: settings.topP,
      });
    } catch (error) {
      console.error('Message sending error:', error);
      toast.error('Failed to send message');
    }
  };

  // Scroll handler
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
      const flattenedMessages = messagesQuery.data.pages.flatMap((page) => page.messages);
      setChatState((prev) => ({ ...prev, messages: flattenedMessages }));
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const { scrollHeight, scrollTop, clientHeight } = scrollArea;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;

    if (chatState.streamingMessageId || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatState.messages, chatState.streamingMessageId]);

  const {
    data: sessionDetails,
    isError: isSessionError,
    error: sessionError,
  } = useQuery({
    queryKey: ['session', params.session_id],
    queryFn: () => getChatSession(params.session_id as string),
    enabled: !!params.session_id,
  });

  useEffect(() => {
    if (sessionDetails?.system_context) {
      setSystemContext(sessionDetails.system_context);
    }
  }, [sessionDetails]);

  useEffect(() => {
    if (isSessionError) {
      toast.error(sessionError instanceof Error ? sessionError.message : 'Failed to fetch session details');
    }
  }, [isSessionError, sessionError]);

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
            placeholder={getInputPlaceholder(
              selectedProvider ? { id: selectedProvider.id } : null,
              selectedModel ? { id: selectedModel.id } : null,
              chatState.streamingMessageId
            )}
            settings={chatSettings}
            onSettingsChange={setChatSettings}
            systemContext={systemContext}
            onSystemContextChange={handleSystemContextChange}
          />
        </div>
      </div>
    </ChatSplitView>
  );
}

function getInputPlaceholder(
  selectedProvider: { id: string } | null,
  selectedModel: { id: string } | null,
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
