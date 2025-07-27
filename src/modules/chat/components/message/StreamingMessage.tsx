import type { StreamingMessageProps } from '@/types/stream';
import { memo } from 'react';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { ReasoningBlockRenderer } from '../markdown/components/ReasoningBlock';
import StreamingIndicator from './StreamingIndicator';
import ToolGroup from './shared/ToolGroup';

const StreamingMessage = memo(function StreamingMessage({
  blocks,
  thinking,
  progressive_tool_args,
  message,
}: StreamingMessageProps) {
  const isStreaming = !blocks.some((block) => block.type === 'done') && message?.status !== 'completed';

  // Simple: if we have a done block, only show tools + final content
  const doneBlock = blocks.find((block) => block.type === 'done');
  if (doneBlock?.content) {
    const toolBlocks = blocks.filter((block) => ['tool_start', 'tool_call', 'tool_result'].includes(block.type));
    const reasoningBlocks = blocks.filter((block) => block.type === 'reasoning');
    const reasoningContent = reasoningBlocks.map((block) => block.content).join('');

    return (
      <div className="space-y-4">
        {reasoningContent && <ReasoningBlockRenderer content={reasoningContent} isStreaming={false} />}
        {toolBlocks.length > 0 && (
          <ToolGroup toolBlocks={toolBlocks} isStreaming={false} progressive_tool_args={progressive_tool_args} />
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={doneBlock.content} isStreaming={false} />
        </div>
      </div>
    );
  }

  // Simple: group all blocks by type
  const toolBlocks = blocks.filter((block) => ['tool_start', 'tool_call', 'tool_result'].includes(block.type));
  const contentBlocks = blocks.filter((block) => block.type === 'content');
  const reasoningBlocks = blocks.filter((block) => block.type === 'reasoning');

  // Combine reasoning blocks content
  const reasoningContent = reasoningBlocks.map((block) => block.content).join('');

  return (
    <div className="space-y-4">
      {/* Thinking during streaming */}
      {thinking?.is_thinking && thinking.content && isStreaming && (
        <StreamingIndicator type="thinking" text={thinking.content} />
      )}

      {/* Reasoning blocks */}
      {reasoningContent && <ReasoningBlockRenderer content={reasoningContent} isStreaming={isStreaming} />}

      {/* Tools */}
      {toolBlocks.length > 0 && (
        <ToolGroup toolBlocks={toolBlocks} isStreaming={isStreaming} progressive_tool_args={progressive_tool_args} />
      )}

      {/* Content */}
      {contentBlocks.length > 0 && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={contentBlocks.map((block) => block.content).join('')} isStreaming={isStreaming} />
          {isStreaming && (
            <span
              className="ml-0.5 inline-block h-4 w-1 bg-current"
              style={{
                animation: 'cursor-blink 1s infinite',
                animationTimingFunction: 'step-end',
              }}
            />
          )}
        </div>
      )}

      {/* Fallback to message content */}
      {!doneBlock && contentBlocks.length === 0 && message?.content?.trim() && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={message.content} isStreaming={false} />
        </div>
      )}
    </div>
  );
});

export default StreamingMessage;
