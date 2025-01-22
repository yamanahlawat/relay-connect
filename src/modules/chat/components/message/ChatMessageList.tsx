import { ScrollArea } from '@/components/ui/scroll-area';
import type { components } from '@/lib/api/schema';
import { ChatMessage } from '@/modules/chat/components/message/ChatMessage';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

type MessageRead = components['schemas']['MessageRead'];

interface ChatMessageListProps {
  messageGroups: MessageRead[][];
  streamingMessageId: string | null;
  onEditClick: (messageId: string) => void;
  editingMessageId: string | null;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  isFetchingNextPage: boolean;
  messagesEndRef: React.Ref<HTMLDivElement>;
  scrollAreaRef: React.Ref<HTMLDivElement>;
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

export const ChatMessageList = memo(function ChatMessageList({
  messageGroups,
  streamingMessageId,
  onEditClick,
  editingMessageId,
  onScroll,
  isFetchingNextPage,
  messagesEndRef,
  scrollAreaRef,
}: ChatMessageListProps) {
  if (messageGroups.length === 0) {
    return <EmptyStatePlaceholder />;
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4 md:px-8" onScroll={onScroll}>
      <div className="mx-auto max-w-5xl space-y-4">
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {messageGroups.map((group) => (
          <ChatMessage
            key={group[0]?.id}
            messages={group}
            role={group[0]?.role}
            isStreaming={group.some((msg) => msg.id === streamingMessageId)}
            onEditClick={group[0]?.role === 'user' ? onEditClick : undefined}
            editingMessageId={editingMessageId}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
});
