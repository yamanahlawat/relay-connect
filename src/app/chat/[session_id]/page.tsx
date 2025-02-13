'use client';

import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { CODING_ASSISTANT_PROMPT } from '@/lib/prompts';
import { ChatInput } from '@/modules/chat/components/input/ChatInput';
import { FileDropOverlay } from '@/modules/chat/components/input/FileDropOverlay';
import { ChatMessageList } from '@/modules/chat/components/message/ChatMessageList';
import { useChat } from '@/modules/chat/hooks/useChat';
import { useFileDrag } from '@/modules/chat/hooks/useFileDrag';
import { useInitialMessage } from '@/modules/chat/hooks/useInitialMessage';
import { useMessageQueries } from '@/modules/chat/hooks/useMessageQueries';
import { useSession } from '@/modules/chat/hooks/useSession';
import { ChatSplitView } from '@/modules/chat/layout/ChatSplitView';
import { getInputPlaceholder } from '@/modules/chat/utils/placeholder';
import { useChatSettings } from '@/stores/chatSettings';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { ChatSettings } from '@/types/chat';
import { MessageRead } from '@/types/message';
import { debounce } from 'lodash';
import { ArrowDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function ChatPage() {
  const params = useParams();
  const sessionId = params.session_id as string;

  // Stores
  const { selectedProvider, selectedModel } = useProviderModel();
  const { initialMessageId, clearInitialMessageId } = useMessageStreamingStore();
  const { settings: chatSettings, updateSettings: setChatSettings } = useChatSettings();

  // Hooks
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // State for system context, scrolling behavior, and scroll-to-bottom icon
  const [disableAutoScroll, setDisableAutoScroll] = useState(false);
  const [systemContext, setSystemContext] = useState(CODING_ASSISTANT_PROMPT);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const fileUpload = useFileUpload(sessionId, {
    onError: () => toast.error('Failed to upload file'),
  });

  const { isDragging } = useFileDrag({
    onDrop: (files) => {
      if (files.length > 0) {
        fileUpload.uploadFiles(files);
      }
    },
    fileTypes: ['image/'],
  });

  // Update system context
  const handleSystemContextChange = async (newPrompt: string) => {
    setSystemContext(newPrompt);
    if (chatState.sessionId) {
      await mutations.updateSession.mutateAsync({
        sessionId: chatState.sessionId,
        update: { system_context: newPrompt },
      });
    }
  };

  // Handle stop generation
  const handleStopGeneration = useCallback(() => {
    if (chatState.sessionId && chatState.streamingMessageId) {
      mutations.stopMessage.mutate();
    }
  }, [chatState.sessionId, chatState.streamingMessageId, mutations.stopMessage]);

  // Global Escape key event listener
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatState.streamingMessageId) {
        handleStopGeneration();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [chatState.streamingMessageId, handleStopGeneration]);

  // Handle message sending
  const handleSendMessage = async (content: string, attachmentIds: string[], settings: ChatSettings) => {
    const trimmedContent = content.trim();
    if (!trimmedContent && fileUpload.files.length === 0) return;

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
          messageData: { content: trimmedContent, status: 'completed' },
        });

        await Promise.all(
          messagesToDelete
            .filter((msg) => !msg.id.startsWith('assistant-'))
            .map((msg) =>
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
        toast.error(`Failed to edit message: ${error}`);
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === editingMessageId ? { ...msg, status: 'failed' } : msg)),
        }));
        return;
      }
    }

    if (!selectedProvider || !selectedModel) {
      toast.error('Please select a provider and model');
      return;
    }

    try {
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

      if (chatState.sessionId && systemContext) {
        await mutations.updateSession.mutateAsync({
          sessionId: chatState.sessionId,
          update: { system_context: systemContext },
        });
      }

      const userMessage = await mutations.createMessage.mutateAsync({
        sessionId: currentSessionId,
        messageData: {
          content,
          role: 'user',
          status: 'completed',
          attachment_ids: attachmentIds,
        },
      });

      await handleMessageStream(currentSessionId, userMessage, {
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        top_p: settings.topP,
      });
    } catch (error) {
      toast.error(`Failed to send message: ${error}`);
    }
  };

  useInitialMessage({
    sessionId: chatState.sessionId,
    initialMessageId,
    handleMessageStream,
    clearInitialMessageId,
  });

  // Debounced scroll handler (also updates the scroll-to-bottom visibility)
  const handleScroll = useMemo(
    () =>
      debounce(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        const distanceFromBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
        // Show the scroll-to-bottom icon if the distance is greater than 50px
        setShowScrollToBottom(distanceFromBottom > 50);

        // Trigger pagination when near the top
        if (scrollArea.scrollTop <= 100 && messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
          messagesQuery.fetchNextPage();
        }
      }, 200),
    [messagesQuery]
  );

  // Combined auto-scroll effect during streaming
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !chatState.streamingMessageId) return;
    // Use a stricter threshold (10px) when auto-scroll is disabled; otherwise 50px
    const threshold = disableAutoScroll ? 15 : 50;
    const nearBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < threshold;
    if (nearBottom) {
      if (disableAutoScroll) setDisableAutoScroll(false);
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [chatState.messages, chatState.streamingMessageId, disableAutoScroll]);

  // Cleanup the debounced scroll handler on unmount
  useEffect(() => {
    return () => handleScroll.cancel();
  }, [handleScroll]);

  // Group messages for display
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

  // Deduplicate and sort API messages
  useEffect(() => {
    if (messagesQuery.data) {
      setChatState((prev) => {
        if (prev.streamingMessageId) return prev;
        const flattenedMessages = messagesQuery.data.pages.flatMap((page) => page.messages);
        flattenedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const messageMap = new Map<string, MessageRead>();
        flattenedMessages.forEach((msg) => {
          const baseId = msg.id.replace('assistant-', '');
          const existingMsg = messageMap.get(baseId);
          if (!existingMsg || new Date(msg.created_at) > new Date(existingMsg.created_at)) {
            messageMap.set(baseId, msg);
          }
        });
        return { ...prev, messages: Array.from(messageMap.values()) };
      });
    }
  }, [messagesQuery.data, setChatState]);

  // Scroll to bottom on initial load or session change
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !shouldScrollToBottom || !chatState.messages.length) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setShouldScrollToBottom(false);
    });
  }, [chatState.messages, shouldScrollToBottom]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !messagesQuery.data || !messagesQuery.isFetchingNextPage) return;
    const previousScrollHeight = scrollArea.scrollHeight;
    requestAnimationFrame(() => {
      const newScrollHeight = scrollArea.scrollHeight;
      scrollArea.scrollTop += newScrollHeight - previousScrollHeight;
    });
  }, [messagesQuery.data, messagesQuery.isFetchingNextPage]);

  // Add scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Update system context on session change
  const { sessionDetails } = useSession(sessionId);
  useEffect(() => {
    if (sessionDetails) {
      setSystemContext(sessionDetails.system_context || '');
    }
  }, [sessionDetails]);

  // Reset scroll flag on session change and cleanup streaming state
  useEffect(() => {
    setShouldScrollToBottom(true);
    return () => {
      if (chatState.streamingMessageId) {
        setChatState((prev) => ({ ...prev, streamingMessageId: null }));
      }
    };
  }, [chatState.streamingMessageId, sessionId, setChatState]);

  // Scroll-to-bottom handler triggered by the icon
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setDisableAutoScroll(false);
  };

  return (
    <ChatSplitView>
      <div ref={chatContainerRef} className="relative flex h-full flex-col">
        {isDragging && <FileDropOverlay isOver={isDragging} />}
        <ChatMessageList
          messageGroups={messageGroups}
          streamingMessageId={chatState.streamingMessageId}
          onEditClick={handleEditStart}
          editingMessageId={editingMessageId}
          onScroll={handleScroll}
          isFetchingNextPage={messagesQuery.isFetchingNextPage}
          messagesEndRef={messagesEndRef}
          scrollAreaRef={scrollAreaRef}
          setDisableAutoScroll={setDisableAutoScroll}
        />
        {/* Conditionally render the scroll-to-bottom icon */}
        {showScrollToBottom && (
          <Button
            onClick={handleScrollToBottom}
            variant="default"
            size="icon"
            className="absolute bottom-40 right-8 z-10 rounded-full shadow-lg"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}
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
            isStreaming={!!chatState.streamingMessageId}
            onStop={handleStopGeneration}
            fileUpload={fileUpload}
          />
        </div>
      </div>
    </ChatSplitView>
  );
}
