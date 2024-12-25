'use client';

import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { createChatSession } from '@/lib/api/chatSessions';
import { createMessage } from '@/lib/api/messages';
import type { components } from '@/lib/api/schema';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { useProviderModel } from '@/stores/providerModel';
import { useMutation } from '@tanstack/react-query';
import { FileText, MessageSquare, NotebookPen, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';

// Types
type MessageCreate = components['schemas']['MessageCreate'];
type SessionCreate = components['schemas']['SessionCreate'];

const ALL_SUGGESTIONS = [
  { icon: FileText, text: 'Summarize text' },
  { icon: MessageSquare, text: 'Generate interview questions' },
  { icon: NotebookPen, text: 'Make a plan' },
  { icon: Sparkles, text: 'Generate excel formulas' },
] as const;

export function WelcomeContent() {
  const router = useRouter();
  const { selectedProvider, selectedModel } = useProviderModel();
  const [message, setMessage] = useState('');

  // Mutations
  const mutations = {
    createSession: useMutation({
      mutationFn: (data: SessionCreate) => createChatSession(data),
      onError: (error) => toast.error(`Failed to create session\n ${error.message}`),
    }),

    createMessage: useMutation({
      mutationFn: ({ sessionId, messageData }: { sessionId: string; messageData: MessageCreate }) =>
        createMessage(sessionId, messageData),
      onError: (error) => toast.error(`Failed to send message\n ${error.message}`),
    }),
  };

  const isSubmitting = mutations.createSession.isPending || mutations.createMessage.isPending;

  const setInitialMessageId = useMessageStreamingStore((state) => state.setInitialMessageId);

  const handleSendMessage = async (content: string) => {
    if (!selectedProvider || !selectedModel) {
      toast.error('Please select a provider and model first');
      return;
    }

    if (!content.trim()) return;

    try {
      const session = await mutations.createSession.mutateAsync({
        title: content.slice(0, 100),
        provider_id: selectedProvider.id,
        llm_model_id: selectedModel.id,
      });

      const message = await mutations.createMessage.mutateAsync({
        sessionId: session.id,
        messageData: {
          content,
          role: 'user',
          status: 'completed',
        },
      });

      // Set the message ID in the store instead of URL
      setInitialMessageId(message.id);

      // Navigate without query params
      router.push(`/chat/${session.id}`);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-3xl space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-medium tracking-tight text-foreground/90 sm:text-3xl">
              What can I help you with?
            </h1>
          </div>

          {/* Suggestions */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALL_SUGGESTIONS.map(({ icon: Icon, text }) => (
              <Button
                key={text}
                variant="outline"
                onClick={() => setMessage(text)}
                disabled={isSubmitting || !selectedProvider || !selectedModel}
                className="h-10 justify-start gap-2 px-4"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{text}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="mt-auto w-full border-t border-border/40">
        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          disabled={isSubmitting || !selectedProvider || !selectedModel}
          placeholder={
            !selectedProvider || !selectedModel ? 'Select a provider and model to start...' : 'Type your message...'
          }
        />
      </div>
      <Toaster />
    </main>
  );
}
