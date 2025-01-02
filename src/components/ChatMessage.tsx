import { MessageContent } from '@/components/MessageContent';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessageProps } from '@/types/chat';
import { Bot, User2 } from 'lucide-react';

export function ChatMessage({ messages, role, isStreaming, onEditClick, editingMessageId }: ChatMessageProps) {
  return (
    <div className="group relative w-full transition-all duration-300">
      <div
        className={cn(
          'mx-auto flex w-full max-w-2xl gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300',
          role === 'user' ? 'bg-accent/50' : 'bg-background',
          isStreaming && 'animate-in fade-in-0'
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
                onEditClick={() => onEditClick?.(message.id)}
                isEditing={editingMessageId === message.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
