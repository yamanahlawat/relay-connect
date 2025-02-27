import ChatContainer from '@/modules/chat/components/ChatContainer';
import { SmartLoadingSkeleton } from '@/modules/chat/components/skeleton/SmartLoadingSkeleton';
import { Suspense } from 'react';

export default function ChatPage() {
  return (
    <Suspense fallback={<SmartLoadingSkeleton />}>
      <ChatContainer />
    </Suspense>
  );
}
