import { memo } from 'react';

import type { MessageRead } from '@/types/message';
import MessageDetails from '../message/MessageDetails';
import StreamingMessage from '../message/StreamingMessage';

interface StreamBlockRendererProps {
  message: MessageRead;
  isStreaming: boolean;
}

const StreamBlockRenderer = memo(function StreamBlockRenderer({ message, isStreaming }: StreamBlockRendererProps) {
  const streamBlocks = message.extra_data?.stream_blocks ?? [];
  const thinking = isStreaming ? (message.extra_data?.thinking ?? { is_thinking: false }) : { is_thinking: false };

  if (isStreaming) {
    return <StreamingMessage blocks={streamBlocks} thinking={thinking} />;
  }

  return <MessageDetails blocks={streamBlocks} />;
});

export default StreamBlockRenderer;
