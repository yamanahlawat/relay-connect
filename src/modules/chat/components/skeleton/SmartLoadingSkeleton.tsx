'use client';

import { useMessageStreamingStore } from '@/stores/messageStreaming';
import { ChatLoadingSkeleton } from './ChatLoadingSkeleton';

export function SmartLoadingSkeleton() {
  // If we have an initialMessageId, we're coming from the welcome page
  // In that case, show an empty div instead of the skeleton for smoother transition
  const initialMessageId = useMessageStreamingStore((state) => state.initialMessageId);

  if (initialMessageId) {
    // Return an empty container with matching structure but no skeleton content
    return <div className="flex-1 overflow-auto p-4 md:p-8" />;
  }

  // For regular navigation to existing chats, show the skeleton
  return <ChatLoadingSkeleton />;
}
