'use client';

import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useViewTransitionRouter } from '@/hooks/useViewTransitionRouter';
import { createChatSession } from '@/lib/api/chatSessions';
import { createMessage } from '@/lib/api/messages';
import type { components } from '@/lib/api/schema';
import { GENERIC_SYSTEM_CONTEXT } from '@/lib/prompts';
import { ChatInput } from '@/modules/chat/components/input/ChatInput';
import { FileDropOverlay } from '@/modules/chat/components/input/FileDropOverlay';
import { useFileDrag } from '@/modules/chat/hooks/useFileDrag';
import { useChatSettings } from '@/stores/chatSettings';
import { useCodeCascade } from '@/stores/codeCascade';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, MessageSquare, NotebookPen, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type SessionCreate = components['schemas']['SessionCreate'];
type MessageCreate = components['schemas']['MessageCreate'];

const ALL_SUGGESTIONS = [
  { icon: FileText, text: 'Summarize text', color: 'text-blue-500' },
  { icon: MessageSquare, text: 'Generate interview questions', color: 'text-purple-500' },
  { icon: NotebookPen, text: 'Make a plan', color: 'text-green-500' },
  { icon: Sparkles, text: 'Generate excel formulas', color: 'text-amber-500' },
] as const;

export function WelcomeContent() {
  const { navigate } = useViewTransitionRouter();
  const [systemContext, setSystemContext] = useState(GENERIC_SYSTEM_CONTEXT);
  const [message, setMessage] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { selectedProvider, selectedModel } = useProviderModel();
  const { clearCode } = useCodeCascade();
  const queryClient = useQueryClient();
  const { settings: chatSettings, updateSettings: setChatSettings } = useChatSettings();
  const setInitialMessageId = useMessageStreamingStore((state) => state.setInitialMessageId);

  // Initialize fileUpload hook
  const fileUpload = useFileUpload('temp', {
    onError: () => {
      toast.error('Failed to upload file');
    },
  });

  // File drag and drop handling
  const { isDragging } = useFileDrag({
    onDrop: (files) => {
      if (files.length > 0) {
        fileUpload.uploadFiles(files);
      }
    },
    fileTypes: ['image/'],
  });

  const mutations = {
    createSession: useMutation({
      mutationFn: (data: SessionCreate) => createChatSession(data),
      onError: (error) => {
        toast.error(`Failed to create session\n ${error.message}`);
        setIsCreatingSession(false);
      },
    }),

    createMessage: useMutation({
      mutationFn: ({ sessionId, messageData }: { sessionId: string; messageData: MessageCreate }) =>
        createMessage(sessionId, messageData),
      onError: (error) => {
        toast.error(`Failed to send message\n ${error.message}`);
        setIsCreatingSession(false);
      },
    }),
  };

  const isSubmitting = isCreatingSession || mutations.createSession.isPending || mutations.createMessage.isPending;

  const handleSendMessage = async (content: string, attachmentIds: string[]) => {
    if (!selectedProvider || !selectedModel) {
      toast.error('Please select a provider and model first');
      return;
    }

    if (!content.trim() && attachmentIds.length === 0) return;

    try {
      // Set loading state
      setIsCreatingSession(true);

      // Clear any existing code in the cascade view
      clearCode();

      // Create a new session
      const session = await mutations.createSession.mutateAsync({
        title: content.slice(0, 100),
        provider_id: selectedProvider.id,
        llm_model_id: selectedModel.id,
        system_context: systemContext,
      });

      // Invalidate the chat sessions query cache to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });

      // Create the initial user message
      const message = await mutations.createMessage.mutateAsync({
        sessionId: session.id,
        messageData: {
          content,
          role: 'user',
          status: 'completed',
          attachment_ids: attachmentIds,
        },
      });

      // Store the message ID for streaming on the chat page
      setInitialMessageId(message.id);

      // Prefetch the chat page data
      await queryClient.prefetchQuery({
        queryKey: ['session', session.id],
        queryFn: () => Promise.resolve(session),
      });

      // Navigate to the chat page with view transition
      navigate(`/chat/${session.id}`);
    } catch (error) {
      toast.error(`Failed to send message: ${error}`);
      setIsCreatingSession(false);
    }
  };

  return (
    <main className="view-transition-welcome-content flex flex-1 flex-col">
      {isDragging && <FileDropOverlay isOver={isDragging} />}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl space-y-6 transition-all duration-300">
          <h1 className="text-center text-2xl font-medium text-foreground/90">What can I help you with?</h1>

          <div className="grid grid-cols-2 gap-2">
            {ALL_SUGGESTIONS.map(({ icon: Icon, text, color }) => (
              <Button
                key={text}
                variant="outline"
                onClick={() => setMessage(text)}
                disabled={isSubmitting || !selectedProvider || !selectedModel}
                className="h-auto justify-start gap-2 p-4 transition-all hover:scale-[1.02] hover:bg-accent/50 active:scale-[0.98]"
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <span className="text-sm font-medium">{text}</span>
              </Button>
            ))}
          </div>

          {/* Model Selection Status */}
          {!selectedProvider || !selectedModel ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
              </span>
              <span className="font-medium text-yellow-700 dark:text-yellow-400">
                Select a provider and model to get started
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Using <span className="font-medium text-green-700 dark:text-green-300">{selectedModel.name}</span> by{' '}
                <span className="font-medium text-green-700 dark:text-green-300">{selectedProvider.name}</span>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isCreatingSession && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating your chat session...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="view-transition-chat-input mt-auto w-full border-t border-border/40">
        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          disabled={isSubmitting || !selectedProvider || !selectedModel}
          placeholder={
            !selectedProvider || !selectedModel
              ? 'Select a provider and model to start...'
              : isCreatingSession
                ? 'Creating your chat session...'
                : 'Type your message...'
          }
          settings={chatSettings}
          onSettingsChange={setChatSettings}
          systemContext={systemContext}
          onSystemContextChange={setSystemContext}
          fileUpload={fileUpload}
        />
      </div>
    </main>
  );
}
