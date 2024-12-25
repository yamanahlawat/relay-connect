'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';
import { Bot, User2 } from 'lucide-react';
import { MessageContent } from './MessageContent';

type MessageRead = components['schemas']['MessageRead'];
type MessageRole = components['schemas']['MessageRole'];

interface ChatMessageProps {
  messages: MessageRead[];
  role: MessageRole;
  isStreaming?: boolean;
}

export function ChatMessage({ messages, role, isStreaming }: ChatMessageProps) {
  return (
    <div className="group relative w-full transition-all duration-300">
      <div
        className={cn(
          'mx-auto flex w-full max-w-3xl gap-4 rounded-lg px-4 py-6',
          role === 'user'
            ? 'bg-accent' // Using your theme's accent color for user messages
            : 'bg-card hover:bg-muted/50', // Card background for AI with subtle hover
          isStreaming &&
            'before:animate-shimmer relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-transparent before:via-muted/10 before:to-transparent'
        )}
      >
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarFallback
              className={cn(
                'text-xs',
                role === 'user' ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground'
              )}
            >
              {role === 'user' ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{role === 'user' ? 'You' : 'Assistant'}</div>
          {messages.map((message) => (
            <MessageContent
              key={message.id}
              message={message}
              isStreaming={isStreaming && message === messages[messages.length - 1]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
