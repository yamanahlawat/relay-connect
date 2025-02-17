import ChatContainer from '@/modules/chat/components/ChatContainer';
import { ChatLoadingSkeleton } from '@/modules/chat/components/skeleton/ChatLoadingSkeleton';
import { Suspense } from 'react';

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingSkeleton />}>
      <ChatContainer />
    </Suspense>
  );
}
