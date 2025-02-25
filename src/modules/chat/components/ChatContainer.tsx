'use client';

import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { CODING_ASSISTANT_PROMPT } from '@/lib/prompts';
import { useBulkDeleteMessages } from '@/lib/queries/messages';
import { ChatInput } from '@/modules/chat/components/input/ChatInput';
import { FileDropOverlay } from '@/modules/chat/components/input/FileDropOverlay';
import { ChatMessageList } from '@/modules/chat/components/message/ChatMessageList';
import { useChat } from '@/modules/chat/hooks/useChat';
import { useFileDrag } from '@/modules/chat/hooks/useFileDrag';
import { useInitialMessage } from '@/modules/chat/hooks/useInitialMessage';
import { useMessageQueries } from '@/modules/chat/hooks/useMessageQueries';
import { useScrollManagement } from '@/modules/chat/hooks/useScrollManagement';
import { useSession } from '@/modules/chat/hooks/useSession';
import { ChatSplitView } from '@/modules/chat/layout/ChatSplitView';
import { getInputPlaceholder } from '@/modules/chat/utils/placeholder';
import { useChatSettings } from '@/stores/chatSettings';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { ChatSettings } from '@/types/chat';
import { MessageRead, MessageRole, StreamingMessageRead } from '@/types/message';
import { ArrowDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Define a common interface for message grouping that both types can satisfy
interface GroupableMessage {
  id: string;
  role: MessageRole;
  content?: string | null;
  // Add other essential properties needed for display
  created_at: string;
  status: string;
  session_id: string;
}

// Type-safe adapter function for message grouping
function adaptMessageForGrouping<T extends GroupableMessage>(messages: T[]): T[][] {
  return messages.reduce((groups: T[][], message) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0]?.role === message.role) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }
    return groups;
  }, []);
}

export default function ChatContainer() {
  const params = useParams();
  const sessionId = params.session_id as string;

  // Stores
  const { selectedProvider, selectedModel } = useProviderModel();
  const { initialMessageId, clearInitialMessageId } = useMessageStreamingStore();
  const { settings: chatSettings, updateSettings: setChatSettings } = useChatSettings();

  // Chat state hooks
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

  const bulkDeleteMessages = useBulkDeleteMessages(sessionId);

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputContainerRef = useRef<HTMLDivElement | null>(null);

  // Local state
  const [systemContext, setSystemContext] = useState(CODING_ASSISTANT_PROMPT);
  const [chatInputHeight, setChatInputHeight] = useState(0);

  // Handle session details
  const { sessionDetails } = useSession(sessionId);

  // File upload & drag handling
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

  // Update messages from query data
  useEffect(() => {
    if (!messagesQuery.data) return;

    setChatState((prev) => {
      if (prev.streamingMessageId) return prev;

      const allMessages = messagesQuery.data.pages.flatMap((page) => page.messages);
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const messageMap = new Map<string, MessageRead>();
      allMessages.forEach((msg) => {
        const baseId = msg.id.replace('assistant-', '');
        const existingMsg = messageMap.get(baseId);
        if (!existingMsg || new Date(msg.created_at) > new Date(existingMsg.created_at)) {
          messageMap.set(baseId, msg);
        }
      });

      return { ...prev, messages: Array.from(messageMap.values()) as StreamingMessageRead[] };
    });
  }, [messagesQuery.data, setChatState]);

  // Scroll management
  const { showScrollToBottom, scrollToBottom, handleScroll } = useScrollManagement({
    scrollAreaRef,
    messagesEndRef,
    streamingMessageId: chatState.streamingMessageId,
    messages: chatState.messages,
    onFetchMore: messagesQuery.fetchNextPage,
    isFetchingMore: messagesQuery.isFetchingNextPage,
    hasMoreMessages: !!messagesQuery.hasNextPage,
  });

  // Group messages by role for display using our adapter function
  const messageGroups = useMemo(() => {
    return adaptMessageForGrouping<StreamingMessageRead>(chatState.messages);
  }, [chatState.messages]);

  // Resize observer for chat input
  useLayoutEffect(() => {
    if (!chatInputContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChatInputHeight(entry.contentRect.height);
      }
    });

    observer.observe(chatInputContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update system context
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

  // Stop generation handling
  const handleStopGeneration = useCallback(() => {
    if (chatState.sessionId && chatState.streamingMessageId) {
      mutations.stopMessage.mutate();
    }
  }, [chatState.sessionId, chatState.streamingMessageId, mutations.stopMessage]);

  // Escape key handler for stopping generation
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatState.streamingMessageId) {
        handleStopGeneration();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [chatState.streamingMessageId, handleStopGeneration]);

  // Update system context from session
  useEffect(() => {
    if (sessionDetails?.system_context) {
      setSystemContext(sessionDetails.system_context);
    }
  }, [sessionDetails]);

  // Process initial message
  useInitialMessage({
    sessionId: chatState.sessionId,
    initialMessageId,
    handleMessageStream,
    clearInitialMessageId,
  });

  // Message sending handler
  const handleSendMessage = useCallback(
    async (content: string, attachmentIds: string[], settings: ChatSettings) => {
      const trimmedContent = content.trim();
      if (!trimmedContent && fileUpload.files.length === 0) return;

      // Edit message flow
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

          const messageIdsToDelete = messagesToDelete
            .filter((msg) => !msg.id.startsWith('assistant-'))
            .map((msg) => msg.id);

          if (messageIdsToDelete.length > 0) {
            await bulkDeleteMessages.mutateAsync(messageIdsToDelete);
          }

          setChatState((prev) => ({
            ...prev,
            messages: [...prev.messages.slice(0, messageIndex), updatedMessage as StreamingMessageRead],
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

      // New message flow
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
    },
    [
      fileUpload.files.length,
      editingMessageId,
      selectedProvider,
      selectedModel,
      chatState.messages,
      chatState.sessionId,
      setChatState,
      mutations.updateMessage,
      mutations.createSession,
      mutations.createMessage,
      mutations.updateSession,
      handleCancelEdit,
      handleMessageStream,
      systemContext,
      bulkDeleteMessages,
    ]
  );

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
        />
        {showScrollToBottom && (
          <Button
            onClick={() => scrollToBottom()}
            variant="default"
            size="icon"
            style={{ bottom: chatInputHeight + 20, right: 32 }}
            className="absolute z-10 rounded-full shadow-lg"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}
        <div ref={chatInputContainerRef}>
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
