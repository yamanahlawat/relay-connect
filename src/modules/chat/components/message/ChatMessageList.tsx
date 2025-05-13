import { CustomScrollArea as ScrollArea } from '@/components/custom/ScrollArea';
import { ChatMessage } from '@/modules/chat/components/message/ChatMessage';
import { MessageRead, StreamingMessageRead } from '@/types/message';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

interface ChatMessageListProps {
  // Accept either MessageRead or StreamingMessageRead arrays
  messageGroups: StreamingMessageRead[][] | MessageRead[][];
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
    <div className="flex flex-1 items-center justify-center text-muted-foreground">
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
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-2 md:px-8" onScroll={onScroll}>
      <div className="mx-auto max-w-5xl space-y-4">
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {messageGroups
          .map((group, groupIndex) => {
            // Skip empty groups
            if (group.length === 0 || !group[0]) return null;

            const message = group[0];
            // Skip messages without ID
            if (!message.id) return null;

            // Default to 'assistant' if role is missing
            const role = (message.role || 'assistant') as 'system' | 'user' | 'assistant';

            return (
              <ChatMessage
                key={message.id || `group-${groupIndex}`}
                messages={group as StreamingMessageRead[]}
                role={role}
                isStreaming={group.some((msg) => msg.id === streamingMessageId)}
                onEditClick={role === 'user' ? onEditClick : undefined}
                editingMessageId={editingMessageId}
              />
            );
          })
          .filter(Boolean)}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
});
