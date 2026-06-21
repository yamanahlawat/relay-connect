import type { MessageRead, StreamingMessageRead } from '@/types/message';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ScrollManagementProps {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  streamingMessageId: string | null;
  // Accept either MessageRead or StreamingMessageRead
  messages: StreamingMessageRead[] | MessageRead[];
  onFetchMore: () => void;
  isFetchingMore: boolean;
  hasMoreMessages: boolean;
}

export function useScrollManagement({
  scrollAreaRef,
  messagesEndRef,
  streamingMessageId,
  messages,
  onFetchMore,
  isFetchingMore,
  hasMoreMessages,
}: ScrollManagementProps) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const isInitialMount = useRef(true);
  const userHasScrolled = useRef(false);
  const shouldAutoScroll = useRef(true);
  const lastMessagesLength = useRef(messages.length);

  // Create a stable debounced scroll handler once (useMemo avoids reading a ref's
  // `.current` during render, which the react-hooks rules disallow).
  const debouncedScrollHandler = useMemo(
    () =>
      debounce(
        (
          scrollArea: HTMLDivElement,
          hasMore: boolean,
          isFetching: boolean,
          onFetch: () => void,
          setShow: (show: boolean) => void
        ) => {
          const distanceFromBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
          setShow(distanceFromBottom > 50);

          // Trigger pagination when near top
          if (scrollArea.scrollTop <= 100 && hasMore && !isFetching) {
            onFetch();
          }
        },
        200
      ),
    []
  );

  // Handle manual scroll events
  const handleManualScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const distanceFromBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;

    // If user scrolls up while streaming, disable auto-scroll
    if (streamingMessageId && distanceFromBottom > 100) {
      userHasScrolled.current = true;
      shouldAutoScroll.current = false;
    }

    // Re-enable auto-scroll once the user returns to the bottom. Done here (an event
    // handler) rather than inside the debounced handler so refs aren't accessed from a
    // function created during render.
    if (distanceFromBottom < 10) {
      shouldAutoScroll.current = true;
      userHasScrolled.current = false;
    }

    debouncedScrollHandler(scrollArea, hasMoreMessages, isFetchingMore, onFetchMore, setShowScrollToBottom);
  }, [debouncedScrollHandler, hasMoreMessages, isFetchingMore, onFetchMore, scrollAreaRef, streamingMessageId]);

  // Check if user is near bottom
  const isNearBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return false;

    const distanceFromBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
    return distanceFromBottom < 100;
  }, [scrollAreaRef]);

  // Handle manual scroll to bottom
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const endRef = messagesEndRef.current;
      if (endRef) {
        endRef.scrollIntoView({ behavior });
        shouldAutoScroll.current = true;
        userHasScrolled.current = false;
      }
    },
    [messagesEndRef]
  );

  // Initial scroll to bottom when messages are loaded
  useEffect(() => {
    if (isInitialMount.current && messages.length > 0) {
      isInitialMount.current = false;
      setTimeout(() => {
        scrollToBottom('auto');
      }, 100);
      lastMessagesLength.current = messages.length;
      return;
    }

    // Handle new message added (not from streaming)
    if (!streamingMessageId && messages.length > lastMessagesLength.current) {
      const wasNearBottom = isNearBottom();
      // Only auto-scroll if user was already at bottom
      if (wasNearBottom) {
        scrollToBottom('smooth');
      }
    }

    lastMessagesLength.current = messages.length;
  }, [messages.length, scrollToBottom, streamingMessageId, isNearBottom]);

  // Handle streaming auto-scroll
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !streamingMessageId) return;

    // Only auto-scroll if:
    // 1. We're currently streaming
    // 2. Either the user hasn't scrolled away, or they've returned to the bottom
    if (shouldAutoScroll.current && !userHasScrolled.current) {
      requestAnimationFrame(() => {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      });
    }
  }, [messages, streamingMessageId, scrollAreaRef]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || !isFetchingMore) return;

    const previousScrollHeight = scrollArea.scrollHeight;
    requestAnimationFrame(() => {
      const newScrollHeight = scrollArea.scrollHeight;
      scrollArea.scrollTop += newScrollHeight - previousScrollHeight;
    });
  }, [isFetchingMore, scrollAreaRef]);

  // Attach scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    scrollArea.addEventListener('scroll', handleManualScroll);

    return () => {
      scrollArea.removeEventListener('scroll', handleManualScroll);
    };
  }, [handleManualScroll, scrollAreaRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedScrollHandler.cancel();
    };
  }, [debouncedScrollHandler]);

  return {
    showScrollToBottom,
    scrollToBottom,
    handleScroll: handleManualScroll,
  };
}
