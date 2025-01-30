'use client';

import type { components } from '@/lib/api/schema';
import { GENERIC_SYSTEM_CONTEXT } from '@/lib/prompts';
import { ChatInput } from '@/modules/chat/components/input/ChatInput';
import { ChatMessageList } from '@/modules/chat/components/message/ChatMessageList';
import { useChat } from '@/modules/chat/hooks/useChat';
import { useInitialMessage } from '@/modules/chat/hooks/useInitialMessage';
import { useMessageQueries } from '@/modules/chat/hooks/useMessageQueries';
import { useSession } from '@/modules/chat/hooks/useSession';
import { ChatSplitView } from '@/modules/chat/layout/ChatSplitView';
import { getInputPlaceholder } from '@/modules/chat/utils/placeholder';
import { useChatSettings } from '@/stores/chatSettings';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { ChatSettings } from '@/types/chat';
import { debounce } from 'lodash';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Types
type MessageRead = components['schemas']['MessageRead'];

export default function ChatPage() {
  const params = useParams();
  const sessionId = params.session_id as string;

  // Stores
  const { selectedProvider, selectedModel } = useProviderModel();
  const { initialMessageId, clearInitialMessageId } = useMessageStreamingStore();
  const { settings: chatSettings, updateSettings: setChatSettings } = useChatSettings();

  // hooks
  const {
    chatState,
    setChatState,
    editingMessageId,
    editingMessage,
    handleMessageStream,
    handleEditStart,
    handleCancelEdit,
  } = useChat(sessionId);

  const { messagesQuery, mutations } = useMessageQueries({
    sessionId,
    initialMessageId,
    editingMessageId,
    setChatState,
  });

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // State for system context
  const [systemContext, setSystemContext] = useState(GENERIC_SYSTEM_CONTEXT);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Update system context
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

  // Handle message sending
  const handleSendMessage = async (content: string, settings: ChatSettings) => {
    // Prevent empty messages
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Handle edit mode
    if (editingMessageId) {
      try {
        const messageIndex = chatState.messages.findIndex((msg) => msg.id === editingMessageId);
        const messagesToDelete = chatState.messages.slice(messageIndex + 1);

        setChatState((prev) => ({
          ...prev,
          messages: prev.messages
            .slice(0, messageIndex + 1)
            .map((msg) =>
              msg.id === editingMessageId ? { ...msg, content: trimmedContent, status: 'processing' } : msg
            ),
        }));

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

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages.slice(0, messageIndex), updatedMessage],
        }));

        handleCancelEdit();
        await handleMessageStream(chatState.sessionId, updatedMessage, settings, true);
        return;
      } catch (error) {
        console.error('Failed to edit message:', error);
        toast.error('Failed to edit message');

        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === editingMessageId ? { ...msg, status: 'failed' } : msg)),
        }));
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

  useInitialMessage({
    sessionId: chatState.sessionId,
    initialMessageId,
    handleMessageStream,
    clearInitialMessageId,
  });

  // Debounced scroll handler
  const handleScroll = useMemo(
    () =>
      debounce(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        const nearBottom = Math.abs(scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight) < 10;
        setIsAtBottom(nearBottom);

        const isNearTop = scrollArea.scrollTop <= 100; // Adjusted condition for near top
        if (isNearTop && messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
          messagesQuery.fetchNextPage(); // Trigger only when near top
        }
      }, 200),
    [messagesQuery]
  );

  useEffect(() => {
    return () => {
      handleScroll.cancel(); // Cleanup the debounced function on unmount
    };
  }, [handleScroll]);

  // Message grouping for display
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
  // Handle API data and deduplication
  useEffect(() => {
    if (messagesQuery.data) {
      setChatState((prev) => {
        // Skip updates during streaming
        if (prev.streamingMessageId) {
          return prev;
        }

        const flattenedMessages = messagesQuery.data.pages.flatMap((page) => page.messages);

        // Sort by creation date
        flattenedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Create a map of the most recent version of each message
        const messageMap = new Map<string, MessageRead>();
        [...flattenedMessages].forEach((msg) => {
          // Remove any assistant- prefix from ID for comparison
          const baseId = msg.id.replace('assistant-', '');
          const existingMsg = messageMap.get(baseId);

          if (!existingMsg || new Date(msg.created_at) > new Date(existingMsg.created_at)) {
            messageMap.set(baseId, msg);
          }
        });

        return {
          ...prev,
          messages: Array.from(messageMap.values()),
        };
      });
    }
  }, [messagesQuery.data, setChatState]);

  // Scroll to the latest message on initial load or session change
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !shouldScrollToBottom || !chatState.messages.length) return;

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setShouldScrollToBottom(false);
    });
  }, [chatState.messages, shouldScrollToBottom]);

  // Maintain scroll position when older messages are loaded
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !messagesQuery.data || !messagesQuery.isFetchingNextPage) return;

    const previousScrollHeight = scrollArea.scrollHeight;

    requestAnimationFrame(() => {
      const newScrollHeight = scrollArea.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight;

      // Adjust scroll position to maintain view
      scrollArea.scrollTop += scrollDiff;
    });
  }, [messagesQuery.data, messagesQuery.isFetchingNextPage]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    scrollArea.addEventListener('scroll', handleScroll);

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !isAtBottom || !chatState.streamingMessageId) return;

    // Auto-scroll to the streaming message only if the user is at the bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, chatState.streamingMessageId, isAtBottom]);

  // Update system context on session change
  const { sessionDetails } = useSession(sessionId);

  useEffect(() => {
    if (sessionDetails) {
      setSystemContext(sessionDetails.system_context || '');
    }
  }, [sessionDetails]);

  useEffect(() => {
    // Reset scroll flag on session change
    setShouldScrollToBottom(true);

    // Optional: Cleanup streaming state
    return () => {
      if (chatState.streamingMessageId) {
        setChatState((prev) => ({
          ...prev,
          streamingMessageId: null,
        }));
      }
    };
  }, [chatState.streamingMessageId, sessionId, setChatState]);

  useEffect(() => {
    return () => {
      handleScroll.cancel();
    };
  }, [handleScroll]);

  return (
    <ChatSplitView>
      <div className="flex h-full flex-col">
        <ChatMessageList
          messageGroups={messageGroups}
          streamingMessageId={chatState.streamingMessageId}
          onEditClick={handleEditStart}
          editingMessageId={editingMessageId}
          onScroll={handleScroll}
          isFetchingNextPage={messagesQuery.isFetchingNextPage}
          messagesEndRef={messagesEndRef}
          scrollAreaRef={scrollAreaRef}
        />

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
            isEditing={!!editingMessageId}
            editMessage={editingMessage}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </ChatSplitView>
  );
}
