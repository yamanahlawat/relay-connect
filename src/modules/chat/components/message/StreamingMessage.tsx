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
    // Create a map to track unique content blocks by their content
    const uniqueContentMap = new Map<string, boolean>();

    // Process blocks while preserving original order from the stream
    const processedBlocks = blocks
      .filter((block) => block.type !== 'done' && block.type !== 'thinking') // Filter out non-display blocks
      .map((block, index) => {
        // For content blocks, check for duplicates
        if (block.type === 'content') {
          const content = block.content as string;
          // If we've already seen this content, skip it
          if (content && uniqueContentMap.has(content)) {
            return null;
          }
          // Mark this content as seen
          if (content) {
            uniqueContentMap.set(content, true);
          }
        }

        // Include this block with its original stream index
        return { ...block, index };
      })
      .filter(Boolean) as Array<StreamBlock & { index: number }>;

    // Add next_block_type information (for tool blocks to know what comes next)
    return processedBlocks.map((block, idx) => ({
      ...block,
      next_block_type: idx < processedBlocks.length - 1 ? processedBlocks[idx + 1]?.type : undefined,
    })) as ProcessedStreamBlock[];
  }, [blocks]);

  return (
    <div className="space-y-2">
      {/* Always show thinking at the top if present */}
      {thinking?.is_thinking && (
        <div className="duration-300 animate-in fade-in-0">
          <StreamingIndicator type="thinking" text={thinking.content} />
        </div>
      )}

      {/* Show accumulated content and tool blocks in their original order */}
      {orderedBlocks.map((block) => {
        if (block.type === 'content') {
          return (
            <ContentBlock
              key={`content-${block.index}`}
              block={block}
              // A block is streaming if it's the last content block and we're still streaming
              is_streaming={
                block.index === Math.max(...orderedBlocks.filter((b) => b.type === 'content').map((b) => b.index)) &&
                isStreamingRef.current
              }
            />
          );
        }

        if (['tool_start', 'tool_call', 'tool_result'].includes(block.type)) {
          return <ToolBlockWrapper key={`tool-${block.index}-${block.tool_call_id}`} block={block} />;
        }

        return null;
      })}
    </div>
  );
});

export default StreamingMessage;
