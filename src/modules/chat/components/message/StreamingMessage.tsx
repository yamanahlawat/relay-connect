import type { ProcessedStreamBlock, StreamingMessageProps } from '@/types/stream';
import React, { memo, useMemo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from '../message/StreamingIndicator';
import ToolBlock from '../message/ToolBlock';

// Extracted Content Block Component
const ContentBlock = memo(function ContentBlock({
  block,
  is_streaming,
}: {
  block: ProcessedStreamBlock;
  is_streaming: boolean;
}) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${is_streaming ? 'typing-effect' : ''}`}>
      <MarkdownRenderer content={block.content || ''} isStreaming={is_streaming} />
      {is_streaming && <span className="typing-cursor" />}
    </div>
  );
});

// Extracted Tool Block Component
const ToolBlockWrapper = memo(function ToolBlockWrapper({ block }: { block: ProcessedStreamBlock }) {
  return (
    <div className="mt-2">
      <ToolBlock
        type={block.type}
        tool_name={block.tool_name}
        tool_args={block.type === 'tool_call' ? block.tool_args : undefined}
        tool_result={block.type === 'tool_result' ? block.tool_result : undefined}
        is_error={block.error_type ? true : false}
        error_message={block.error_detail}
        is_streaming={!block.next_block_type}
        next_block_type={block.next_block_type}
      />
    </div>
  );
});

// Error Boundary Component
class MessageErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500">An error occurred while rendering this message.</div>;
    }

    return this.props.children;
  }
}

const StreamingMessage = memo(function StreamingMessage({ blocks, thinking }: StreamingMessageProps) {
  // Process all blocks to maintain order and streaming state
  const orderedBlocks = useMemo(() => {
    return blocks
      .map((block, index) => ({
        ...block,
        index,
        next_block_type: index < blocks.length - 1 ? blocks[index + 1]?.type : undefined,
      }))
      .sort((a, b) => a.index - b.index) as ProcessedStreamBlock[];
  }, [blocks]);

  return (
    <MessageErrorBoundary>
      <div className="space-y-2">
        {/* Thinking state - Always at top */}
        {thinking?.isThinking && (
          <div className="duration-300 animate-in fade-in-0">
            <StreamingIndicator type="thinking" text={thinking?.content} />
          </div>
        )}

        {/* Content and Tools */}
        {orderedBlocks.map((block, idx) => {
          if (block.type === 'content') {
            return <ContentBlock key={`content-${idx}`} block={block} is_streaming={!block.next_block_type} />;
          }

          if (block.type === 'tool_start' || block.type === 'tool_call' || block.type === 'tool_result') {
            return <ToolBlockWrapper key={`${block.tool_call_id}-${block.type}`} block={block} />;
          }

          return null;
        })}
      </div>
    </MessageErrorBoundary>
  );
});

export default StreamingMessage;
