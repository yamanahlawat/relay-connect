import { memo } from 'react';

import type { StreamingMessageRead } from '@/types/message';
import MessageDetails from '../message/MessageDetails';
import StreamingMessage from '../message/StreamingMessage';

interface StreamBlockRendererProps {
  message: StreamingMessageRead;
  is_streaming: boolean;
}

const StreamBlockRenderer = memo(function StreamBlockRenderer({ message, is_streaming }: StreamBlockRendererProps) {
  const stream_blocks = message.extra_data.stream_blocks ?? [];
  const thinkingState = message.extra_data.thinking;

  const thinking = {
    is_thinking:
      is_streaming && (!stream_blocks.length || stream_blocks[stream_blocks.length - 1]?.type === 'thinking'),
    content: thinkingState?.content,
  };

  if (is_streaming) {
    return <StreamingMessage blocks={stream_blocks} thinking={thinking} />;
  }

  return <MessageDetails blocks={stream_blocks} />;
});

export default StreamBlockRenderer;
