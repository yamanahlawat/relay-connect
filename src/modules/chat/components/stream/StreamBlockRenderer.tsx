import { memo } from 'react';

import type { StreamingMessageRead } from '@/types/message';
import MessageDetails from '../message/MessageDetails';
import StreamingMessage from '../message/StreamingMessage';

interface StreamBlockRendererProps {
  message: StreamingMessageRead;
  is_streaming: boolean;
}

const StreamBlockRenderer = memo(function StreamBlockRenderer({ message, is_streaming }: StreamBlockRendererProps) {
  const streamBlocks = message.extra_data.stream_blocks ?? [];
  const thinkingState = message.extra_data.thinking;

  // Convert thinking state to match StreamingMessageProps type
  const thinking = {
    is_thinking: thinkingState?.isThinking ?? false,
    content: thinkingState?.content,
  };

  if (is_streaming) {
    return <StreamingMessage blocks={streamBlocks} thinking={thinking} />;
  }

  return <MessageDetails blocks={streamBlocks} />;
});

export default StreamBlockRenderer;
