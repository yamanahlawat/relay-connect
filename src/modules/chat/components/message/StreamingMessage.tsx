import type { ProcessedStreamBlock, StreamingMessageProps } from '@/types/stream';
import { memo, useMemo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import StreamingIndicator from '../message/StreamingIndicator';
import ToolBlock from '../message/ToolBlock';

const StreamingMessage = memo(function StreamingMessage({ blocks, thinking }: StreamingMessageProps) {
  // Process all blocks to maintain order and streaming state
  const orderedBlocks = useMemo(() => {
    return blocks
      .map((block, index) => ({
        ...block,
        index: block.index || index,
        next_block_type: index < blocks.length - 1 ? blocks[index + 1].type : undefined,
      }))
      .sort((a, b) => a.index - b.index) as ProcessedStreamBlock[];
  }, [blocks]);

  return (
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
          // For content blocks, streaming if there's no next block
          const is_streaming = !block.next_block_type;
          return (
            <div
              key={`content-${idx}`}
              className={`prose prose-sm dark:prose-invert max-w-none ${is_streaming ? 'typing-effect' : ''}`}
            >
              <MarkdownRenderer content={block.content || ''} is_streaming={is_streaming} />
              {is_streaming && <span className="typing-cursor" />}
            </div>
          );
        }

        if (block.type === 'tool_start' || block.type === 'tool_call' || block.type === 'tool_result') {
          return (
            <div key={`${block.tool_call_id}-${block.type}`} className="mt-2">
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
        }

        return null;
      })}
    </div>
  );
});

export default StreamingMessage;
