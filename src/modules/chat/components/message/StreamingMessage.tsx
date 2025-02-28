import type { ProcessedStreamBlock, StreamBlock, StreamingMessageProps } from '@/types/stream';
import { memo, useEffect, useMemo, useRef } from 'react';
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
  const contentString = typeof block.content === 'string' ? block.content : '';

  // Use a ref to track if this block was rendered with streaming
  const wasStreamingRef = useRef(is_streaming);

  // If the block was streaming before, keep it as streaming for visual consistency
  useEffect(() => {
    if (is_streaming) {
      wasStreamingRef.current = true;
    }
  }, [is_streaming]);

  // Check the content length to determine if we should keep streaming effect
  const hasEnoughContentForStreaming = contentString.length > 3;

  // Determine if we should show the streaming effect
  const showStreamingEffect = is_streaming || (wasStreamingRef.current && hasEnoughContentForStreaming);

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${showStreamingEffect ? 'typing-effect' : ''}`}>
      <MarkdownRenderer content={contentString} isStreaming={showStreamingEffect} />
      {showStreamingEffect && <span className="typing-cursor" />}
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
        is_streaming={!block.next_block_type}
        next_block_type={block.next_block_type}
      />
    </div>
  );
});

const StreamingMessage = memo(function StreamingMessage({ blocks, thinking }: StreamingMessageProps) {
  const prevBlocksRef = useRef<StreamBlock[]>([]);
  const isStreamingRef = useRef(true);

  // Check if we have new content to show streaming effect for
  useEffect(() => {
    // Don't reset streaming state if blocks are the same
    if (blocks.length === prevBlocksRef.current.length) return;

    // Check if we have a done block
    const doneBlock = blocks.find((block) => block.type === 'done');

    if (doneBlock) {
      // If we have a done block, mark as not streaming after a short delay
      setTimeout(() => {
        isStreamingRef.current = false;
      }, 100);
    } else {
      // If no done block, we're still streaming
      isStreamingRef.current = true;
    }

    prevBlocksRef.current = [...blocks];
  }, [blocks]);

  // Process all blocks to maintain order and streaming state
  const orderedBlocks = useMemo(() => {
    // Filter out duplicate content blocks (same content at same position)
    const processedBlocks = blocks.reduce(
      (acc, block, index) => {
        // Always include non-content blocks
        if (block.type !== 'content') {
          if (block.type !== 'done') {
            // Skip done blocks in UI
            acc.push({ ...block, index });
          }
          return acc;
        }

        // For content blocks, check if we already have one with the same content
        const existingBlock = acc.find((b) => b.type === 'content' && b.content === block.content);

        if (!existingBlock) {
          acc.push({ ...block, index });
        }

        return acc;
      },
      [] as Array<StreamBlock & { index: number }>
    );

    // Add next_block_type and sort
    return processedBlocks
      .map((block, idx) => ({
        ...block,
        next_block_type: idx < processedBlocks.length - 1 ? processedBlocks[idx + 1]?.type : undefined,
      }))
      .sort((a, b) => a.index - b.index) as ProcessedStreamBlock[];
  }, [blocks]);

  return (
    <div className="space-y-2">
      {/* Always show thinking at the top if present */}
      {thinking?.is_thinking && (
        <div className="duration-300 animate-in fade-in-0">
          <StreamingIndicator type="thinking" text={thinking.content} />
        </div>
      )}

      {/* Show accumulated content and tool blocks */}
      {orderedBlocks.map((block) => {
        if (block.type === 'content') {
          return (
            <ContentBlock
              key={`content-${block.index}`}
              block={block}
              // A block is streaming if it's the last one and we're still streaming
              is_streaming={block.index === orderedBlocks.length - 1 && isStreamingRef.current}
            />
          );
        }

        if (['tool_start', 'tool_call', 'tool_result'].includes(block.type)) {
          return <ToolBlockWrapper key={`tool-${block.index}`} block={block} />;
        }

        return null;
      })}
    </div>
  );
});

export default StreamingMessage;
