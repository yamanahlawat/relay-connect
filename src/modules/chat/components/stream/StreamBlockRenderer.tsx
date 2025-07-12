import { memo } from 'react';

import type { StreamingMessageRead } from '@/types/message';
import ListingMessage from '../message/ListingMessage';
import StreamingMessage from '../message/StreamingMessage';

interface StreamBlockRendererProps {
  message: StreamingMessageRead;
  is_streaming: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StreamBlockRenderer = memo(function StreamBlockRenderer({ message, is_streaming: _ }: StreamBlockRendererProps) {
  const streamBlocks = message.extra_data.stream_blocks ?? [];
  const thinkingState = message.extra_data.thinking;
  const progressiveToolArgs = message.extra_data.progressive_tool_args;

  // Convert thinking state to match StreamingMessageProps type
  const thinking = {
    is_thinking: thinkingState?.isThinking ?? false,
    content: thinkingState?.content,
  };

  // If we have message content but no stream blocks, show the final message content with markdown
  if ((!streamBlocks || streamBlocks.length === 0) && message.content && message.content.trim()) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <StreamingMessage
          blocks={[]}
          thinking={thinking}
          progressive_tool_args={progressiveToolArgs}
          message={message}
        />
      </div>
    );
  }

  // If we have stream blocks, always use the StreamingMessage component
  // It will handle both streaming and completed states internally
  if (streamBlocks.length > 0) {
    return (
      <StreamingMessage
        blocks={streamBlocks}
        thinking={thinking}
        progressive_tool_args={progressiveToolArgs}
        message={message}
      />
    );
  }

  // Fallback to listing message if no stream blocks but we have thinking or other data
  return <ListingMessage blocks={streamBlocks} thinking={thinking} message={message} />;
});

export default StreamBlockRenderer;
