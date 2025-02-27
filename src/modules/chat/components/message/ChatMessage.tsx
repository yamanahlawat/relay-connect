import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MessageAttachments } from '@/modules/chat/components/message/MessageAttachments';
import { MessageContent } from '@/modules/chat/components/message/MessageContent';
import { useMessageStreamingStore } from '@/stores/messageStreaming';
import type { ChatMessageProps } from '@/types/message';
import { Bot, User2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ChatMessage({ messages, role, isStreaming, onEditClick, editingMessageId }: ChatMessageProps) {
  // Check if we're coming from welcome page by detecting initialMessageId
  const initialMessageId = useMessageStreamingStore((state) => state.initialMessageId);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Determine if this is the first message after transitioning from welcome
  const isFirstMessageAfterTransition =
    initialMessageId && messages.some((msg) => msg.id === initialMessageId || msg.parent_id === initialMessageId);

  // Enable animation briefly after component mounts if this is the first message
  useEffect(() => {
    if (isFirstMessageAfterTransition) {
      setShouldAnimate(true);
      // Disable animation after it plays once
      const timer = setTimeout(() => setShouldAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isFirstMessageAfterTransition]);

  // Combine attachments from all messages in the group (for user messages)
  const attachments =
    role === 'user'
      ? messages.reduce<NonNullable<(typeof messages)[number]['attachments']>>((acc, msg) => {
          if (msg.attachments && msg.attachments.length > 0) {
            return [...acc, ...msg.attachments];
          }
          return acc;
        }, [])
      : [];

  return (
    <div className="group relative w-full transition-all duration-300">
      {/* Attachment Section */}
      {role === 'user' && attachments.length > 0 && (
        <div className="mx-auto max-w-2xl px-3 pb-2">
          <MessageAttachments attachments={attachments} />
        </div>
      )}
      <div
        className={cn(
          'mx-auto flex w-full max-w-2xl gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300',
          role === 'user' ? 'bg-accent/50' : 'bg-background',
          isStreaming && 'animate-in fade-in-0',
          // Apply special animation for messages that appear right after welcome page transition
          shouldAnimate && isFirstMessageAfterTransition && 'animate-message-in'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className={cn('h-7 w-7 ring-1', role === 'user' ? 'ring-accent/50' : 'ring-primary/20')}>
            <AvatarFallback className={cn('text-xs', role === 'user' ? 'bg-accent/50' : 'bg-primary/10')}>
              {role === 'user' ? <User2 className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{role === 'user' ? 'You' : 'Assistant'}</span>
          </div>

          {/* Messages */}
          <div className="space-y-2.5">
            {messages.map((message) => (
              <MessageContent
                key={message.id}
                message={message}
                isStreaming={isStreaming && message === messages[messages.length - 1]}
                role={role}
                onEditClick={onEditClick}
                isEditing={editingMessageId === message.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
